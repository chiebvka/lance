import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { telegramService } from "@/utils/telegram";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

// Map Stripe subscription statuses to our database enum
function mapStripeStatusToDbStatus(stripeStatus: string, hasPaymentMethod: boolean = false): string {
  const statusMap: Record<string, string> = {
    'trialing': hasPaymentMethod ? 'active' : 'trial', // If payment method exists, consider it active
    'active': 'active', 
    'past_due': 'suspended',
    'canceled': 'cancelled',
    'cancelled': 'cancelled',
    'unpaid': 'expired',
    'incomplete': 'pending',
    'incomplete_expired': 'expired',
    'paused': 'suspended',
  };
  
  return statusMap[stripeStatus] || 'pending';
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text (this is crucial for signature verification)
    const body = await request.text();
    
    // Get the signature from headers
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("❌ No Stripe signature found in headers");
      return NextResponse.json(
        { error: "No Stripe signature found" },
        { status: 400 }
      );
    }

    console.log("🔍 Webhook secret (first 10 chars):", webhookSecret.substring(0, 10));
    console.log("🔍 Signature:", signature);
    console.log("🔍 Body length:", body.length);

    let event: Stripe.Event;

    try {
      // Construct the event using the raw body, signature, and webhook secret
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`✅ Webhook received and verified: ${event.type}`);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err}` },
        { status: 400 }
      );
    }

    // Create Supabase service role client (bypasses RLS)
    const supabase = createServiceRoleClient();

    // Process the event
    switch ((event as any).type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Processing checkout.session.completed: ${session.id}`);
        
        if (session.mode === "subscription" && session.metadata?.organizationId) {
          // Get subscription details from Stripe with expanded data
          const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string, {
            expand: ['default_payment_method', 'latest_invoice']
          });
          const priceId = stripeSubscription.items.data[0]?.price.id;
          
          // Get price details to determine billing cycle and amount
          let billingCycle = "monthly";
          let amount = 0;
          let currency = "usd";
          let planType = "starter";
          
          if (priceId) {
            const price = await stripe.prices.retrieve(priceId);
            billingCycle = price.recurring?.interval === "year" ? "yearly" : "monthly";
            amount = price.unit_amount || 0;
            currency = price.currency;
            
            // Get product to determine plan type
            const product = await stripe.products.retrieve(price.product as string);
            planType = product.name.toLowerCase().includes("pro") ? "pro" : "starter";
          }

          // Check if subscription has payment method
          const hasPaymentMethod = !!(stripeSubscription.default_payment_method || 
                                     (stripeSubscription as any).latest_invoice?.payment_intent?.payment_method);
          
          console.log(`💳 Payment method status: ${hasPaymentMethod ? 'Has payment method' : 'No payment method'}`);
          console.log(`📊 Stripe status: ${stripeSubscription.status}`);

          // Update organization with subscription details
          const mappedStatus = mapStripeStatusToDbStatus(stripeSubscription.status, hasPaymentMethod);
          const subscriptionEndDate = (stripeSubscription as any).current_period_end 
            ? new Date((stripeSubscription as any).current_period_end * 1000).toISOString()
            : null;

          // Prepare the update object based on the subscription status
          const updateData: any = {
            subscriptionStartDate: new Date((stripeSubscription as any).start_date * 1000).toISOString(),
            subscriptionId: stripeSubscription.id,
            planType: planType,
            billingCycle: billingCycle,
            stripeMetadata: {
              sessionId: session.id,
              customerId: session.customer as string,
              subscriptionId: session.subscription as string,
              eventId: event.id,
              eventType: event.type,
            },
          };

          // Handle status-specific requirements
          if (mappedStatus === 'active' && subscriptionEndDate) {
            updateData.subscriptionstatus = mappedStatus;
            updateData.subscriptionEndDate = subscriptionEndDate; // This is the next billing date
            // Clear trial end date when becoming active
            updateData.trialEndsAt = null;
          } else if (mappedStatus === 'trial') {
            updateData.subscriptionstatus = mappedStatus;
            // Keep existing trialEndsAt or set subscription end as trial end
            if (subscriptionEndDate) {
              updateData.trialEndsAt = subscriptionEndDate;
            }
          } else {
            // For other statuses, set the status and end date if available
            updateData.subscriptionstatus = mappedStatus;
            if (subscriptionEndDate) {
              updateData.subscriptionEndDate = subscriptionEndDate;
            }
          }

          const { error: orgError } = await supabase
            .from("organization")
            .update(updateData)
            .eq("id", session.metadata.organizationId);

          if (orgError) {
            console.error("❌ Error updating organization:", orgError);
          } else {
            console.log("✅ Organization updated successfully");
          }

          // Upsert subscription record (update if exists, insert if not)
          console.log(`🔍 Checking for existing subscription with Stripe ID: ${session.subscription}`);
          
          const { data: existingSubscription, error: checkError } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("stripeSubscriptionId", session.subscription as string)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error("❌ Error checking for existing subscription:", checkError);
          }

          if (existingSubscription) {
            // Update existing subscription
            console.log(`📝 Updating existing subscription ID: ${existingSubscription.id}`);
            const { error: subUpdateError } = await supabase
              .from("subscriptions")
              .update({
                subscriptionStatus: mapStripeStatusToDbStatus(stripeSubscription.status, hasPaymentMethod),
                planType: planType,
                billingCycle: billingCycle,
                amount: amount / 100, // Convert from cents to dollars
                currency: currency,
                startsAt: new Date((stripeSubscription as any).start_date * 1000).toISOString(),
                endsAt: (stripeSubscription as any).current_period_end 
                  ? new Date((stripeSubscription as any).current_period_end * 1000).toISOString()
                  : null,
                stripeMetadata: {
                  sessionId: session.id,
                  priceId: priceId,
                  eventId: event.id,
                  eventType: event.type,
                },
                updatedAt: new Date().toISOString(),
              })
              .eq("id", existingSubscription.id);

            if (subUpdateError) {
              console.error("❌ Error updating subscription record:", subUpdateError);
            } else {
              console.log("✅ Existing subscription record updated successfully");
              
              // Send Telegram notification for subscription update
              try {
                await telegramService.notifySubscription({
                  organizationName: session.metadata?.organizationName || 'Unknown',
                  userEmail: session.metadata?.userEmail || 'Unknown',
                  planType: planType,
                  billingCycle: billingCycle,
                  amount: amount / 100,
                  currency: currency,
                  action: 'updated'
                });
              } catch (telegramError) {
                console.error("Failed to send Telegram notification:", telegramError);
              }
            }
          } else {
            // Create new subscription record
            console.log("➕ Creating new subscription record");
            const { error: subInsertError } = await supabase
              .from("subscriptions")
              .insert({
                organizationId: session.metadata.organizationId,
                stripeSubscriptionId: session.subscription as string,
                stripeCustomerId: session.customer as string,
                subscriptionStatus: mapStripeStatusToDbStatus(stripeSubscription.status, hasPaymentMethod),
                planType: planType,
                billingCycle: billingCycle,
                amount: amount / 100, // Convert from cents to dollars
                currency: currency,
                startsAt: new Date((stripeSubscription as any).start_date * 1000).toISOString(),
                endsAt: (stripeSubscription as any).current_period_end 
                  ? new Date((stripeSubscription as any).current_period_end * 1000).toISOString()
                  : null,
                createdBy: session.metadata.userId,
                stripeMetadata: {
                  sessionId: session.id,
                  priceId: priceId,
                  eventId: event.id,
                  eventType: event.type,
                },
              });

            if (subInsertError) {
              console.error("❌ Error creating subscription record:", subInsertError);
            } else {
              console.log("✅ New subscription record created successfully");
              
              // Send Telegram notification for new subscription
              try {
                await telegramService.notifySubscription({
                  organizationName: session.metadata?.organizationName || 'Unknown',
                  userEmail: session.metadata?.userEmail || 'Unknown',
                  planType: planType,
                  billingCycle: billingCycle,
                  amount: amount / 100,
                  currency: currency,
                  action: 'started'
                });
              } catch (telegramError) {
                console.error("Failed to send Telegram notification:", telegramError);
              }
            }
          }
        }
        break;

      case "customer.subscription.updated":
        const subscription = event.data.object as any;
        console.log(`Processing customer.subscription.updated: ${subscription.id}`);
        
        // Get price details for updated subscription
        const updatedPriceId = subscription.items.data[0]?.price.id;
        let updatedBillingCycle = "monthly";
        let updatedAmount = 0;
        let updatedCurrency = "usd";
        let updatedPlanType = "starter";
        
        if (updatedPriceId) {
          const updatedPrice = await stripe.prices.retrieve(updatedPriceId);
          updatedBillingCycle = updatedPrice.recurring?.interval === "year" ? "yearly" : "monthly";
          updatedAmount = updatedPrice.unit_amount || 0;
          updatedCurrency = updatedPrice.currency;
          
          // Get product to determine plan type
          const updatedProduct = await stripe.products.retrieve(updatedPrice.product as string);
          updatedPlanType = updatedProduct.name.toLowerCase().includes("pro") ? "pro" : "starter";
        }
        
        // Check if subscription has payment method for updated subscription
        const updatedHasPaymentMethod = !!(subscription.default_payment_method || 
                                          subscription.latest_invoice?.payment_intent?.payment_method);

        // Update subscription status
        const { error: subUpdateError } = await supabase
          .from("subscriptions")
          .update({
            subscriptionStatus: mapStripeStatusToDbStatus(subscription.status, updatedHasPaymentMethod),
            planType: updatedPlanType,
            billingCycle: updatedBillingCycle,
            amount: updatedAmount / 100, // Convert from cents to dollars
            currency: updatedCurrency,
            endsAt: subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            stripeMetadata: {
              status: subscription.status,
              currentPeriodEnd: subscription.current_period_end,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              priceId: updatedPriceId,
              eventId: event.id,
              eventType: event.type,
            },
          })
          .eq("stripeSubscriptionId", subscription.id);

        if (subUpdateError) {
          console.error("❌ Error updating subscription:", subUpdateError);
        } else {
          console.log("✅ Subscription updated successfully");
        }

        // Also update organization subscription status
        const organizationMetadata = subscription.metadata;
        if (organizationMetadata?.organizationId) {
          const mappedOrgStatus = mapStripeStatusToDbStatus(subscription.status, updatedHasPaymentMethod);
          const orgSubscriptionEndDate = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          // Prepare the update object based on the subscription status
          const orgUpdateData: any = {
            planType: updatedPlanType,
            billingCycle: updatedBillingCycle,
            subscriptionMetadata: {
              status: subscription.status,
              currentPeriodEnd: subscription.current_period_end,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              priceId: updatedPriceId,
              eventId: event.id,
              eventType: event.type,
            },
          };

          // Handle status-specific requirements
          if (mappedOrgStatus === 'active' && orgSubscriptionEndDate) {
            orgUpdateData.subscriptionstatus = mappedOrgStatus;
            orgUpdateData.subscriptionEndDate = orgSubscriptionEndDate;
            // Clear trial end date when becoming active
            orgUpdateData.trialEndsAt = null;
          } else if (mappedOrgStatus === 'trial') {
            orgUpdateData.subscriptionstatus = mappedOrgStatus;
            // Keep existing trialEndsAt or set subscription end as trial end
            if (orgSubscriptionEndDate) {
              orgUpdateData.trialEndsAt = orgSubscriptionEndDate;
            }
          } else {
            // For other statuses, set the status and end date if available
            orgUpdateData.subscriptionstatus = mappedOrgStatus;
            if (orgSubscriptionEndDate) {
              orgUpdateData.subscriptionEndDate = orgSubscriptionEndDate;
            }
          }

          const { error: orgUpdateError } = await supabase
            .from("organization")
            .update(orgUpdateData)
            .eq("id", organizationMetadata.organizationId);

          if (orgUpdateError) {
            console.error("❌ Error updating organization subscription:", orgUpdateError);
          } else {
            console.log("✅ Organization subscription updated successfully");
            
            // Send Telegram notification for subscription update
            try {
              await telegramService.notifySubscription({
                organizationName: organizationMetadata?.organizationName || 'Unknown',
                userEmail: organizationMetadata?.userEmail || 'Unknown',
                planType: updatedPlanType,
                billingCycle: updatedBillingCycle,
                amount: updatedAmount / 100,
                currency: updatedCurrency,
                action: 'updated'
              });
            } catch (telegramError) {
              console.error("Failed to send Telegram notification:", telegramError);
            }
          }
        }
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as any;
        console.log(`Processing customer.subscription.deleted: ${deletedSubscription.id}`);
        
        // Extract cancellation reason if available
        const cancellationDetails = deletedSubscription.cancellation_details || {};
        const cancellationReason = cancellationDetails.reason;
        const cancellationComment = cancellationDetails.comment;
        
        console.log(`Cancellation reason: ${cancellationReason}, Comment: ${cancellationComment}`);
        
        // Mark subscription as cancelled
        const { error: subDeleteError } = await supabase
          .from("subscriptions")
          .update({
            subscriptionStatus: "cancelled",
            endsAt: deletedSubscription.current_period_end 
              ? new Date(deletedSubscription.current_period_end * 1000).toISOString()
              : new Date().toISOString(),
            stripeMetadata: {
              eventId: event.id,
              eventType: event.type,
              cancellationReason: cancellationReason,
              cancellationComment: cancellationComment,
            },
          })
          .eq("stripeSubscriptionId", deletedSubscription.id);

        if (subDeleteError) {
          console.error("❌ Error deleting subscription:", subDeleteError);
        } else {
          console.log("✅ Subscription cancelled successfully");
        }

        // Also update organization
        const deletedOrgMetadata = deletedSubscription.metadata;
        if (deletedOrgMetadata?.organizationId) {
          const { error: orgDeleteError } = await supabase
            .from("organization")
            .update({
              subscriptionstatus: "cancelled",
              subscriptionEndDate: deletedSubscription.current_period_end 
                ? new Date(deletedSubscription.current_period_end * 1000).toISOString()
                : new Date().toISOString(),
              subscriptionMetadata: {
                eventId: event.id,
                eventType: event.type,
                cancellationReason: cancellationReason,
                cancellationComment: cancellationComment,
              },
            })
            .eq("id", deletedOrgMetadata.organizationId);

          if (orgDeleteError) {
            console.error("❌ Error updating organization on subscription delete:", orgDeleteError);
          } else {
            console.log("✅ Organization updated on subscription delete");
          }
          
          // Insert cancellation record into cancellations table
          try {
            const { error: cancellationError } = await supabase
              .from("cancellations")
              .insert({
                organizationId: deletedOrgMetadata.organizationId,
                email: deletedOrgMetadata.userEmail || 'Unknown',
                reason: cancellationReason || 'No reason provided',
                notes: cancellationComment || null,
                stripeId: deletedSubscription.id,
                stripeData: {
                  subscriptionId: deletedSubscription.id,
                  customerId: deletedSubscription.customer,
                  cancellationDetails: cancellationDetails,
                  eventId: event.id,
                  eventType: event.type,
                  cancelledAt: new Date().toISOString(),
                },
              });

            if (cancellationError) {
              console.error("❌ Error inserting cancellation record:", cancellationError);
            } else {
              console.log("✅ Cancellation record inserted successfully");
            }
          } catch (insertError) {
            console.error("❌ Error inserting cancellation record:", insertError);
          }
          
          // Send Telegram notification for subscription cancellation
          try {
            await telegramService.notifyCancellation({
              organizationName: deletedOrgMetadata.organizationName || 'Unknown',
              userEmail: deletedOrgMetadata.userEmail || 'Unknown',
              planType: deletedOrgMetadata.planType || 'Unknown',
              reason: cancellationReason,
              comment: cancellationComment,
              endDate: deletedSubscription.current_period_end 
                ? new Date(deletedSubscription.current_period_end * 1000).toISOString()
                : new Date().toISOString(),
            });
          } catch (telegramError) {
            console.error("Failed to send Telegram notification:", telegramError);
          }
        }
        break;

      case "customer.subscription.trial_will_end":
        const trialSubscription = event.data.object as any;
        console.log(`Processing customer.subscription.trial_will_end: ${trialSubscription.id}`);
        
        // Get organization from subscription metadata
        const trialOrgMetadata = trialSubscription.metadata;
        if (trialOrgMetadata?.userId) {
          // Get user's organization
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("organizationId")
            .eq("profile_id", trialOrgMetadata.userId)
            .single();

          if (userProfile?.organizationId) {
            // Create trial ending notification
            const trialEndDate = new Date(trialSubscription.trial_end * 1000);
            const { error: notificationError } = await supabase
              .from("notifications")
              .insert({
                organizationId: userProfile.organizationId,
                userId: trialOrgMetadata.userId,
                title: "Trial ending soon",
                message: `Your free trial ends on ${trialEndDate.toLocaleDateString()}. Add a payment method to continue using Lance.`,
                type: "trial_reminder",
                actionUrl: "/protected/settings/billing",
                metadata: {
                  subscriptionId: trialSubscription.id,
                  trialEndDate: trialSubscription.trial_end,
                  eventId: event.id,
                  eventType: event.type,
                },
                expiresAt: trialEndDate.toISOString(),
              });

            if (notificationError) {
              console.error("❌ Error creating trial reminder notification:", notificationError);
            } else {
              console.log("✅ Trial reminder notification created successfully");
            }
          }
        }
        break;

      case "invoice.payment_failed":
        const failedInvoice = event.data.object as any;
        console.log(`Processing invoice.payment_failed: ${failedInvoice.id}`);
        
        if (failedInvoice.subscription) {
          // Get subscription to find organization
          const failedSubscription = await stripe.subscriptions.retrieve(failedInvoice.subscription);
          const failedOrgMetadata = failedSubscription.metadata;
          
          if (failedOrgMetadata?.userId) {
            const { data: userProfile } = await supabase
              .from("profiles")
              .select("organizationId")
              .eq("profile_id", failedOrgMetadata.userId)
              .single();

            if (userProfile?.organizationId) {
              // Create payment failed notification
              const { error: notificationError } = await supabase
                .from("notifications")
                .insert({
                  organizationId: userProfile.organizationId,
                  userId: failedOrgMetadata.userId,
                  title: "Payment failed",
                  message: "Your payment couldn't be processed. Please update your payment method to avoid service interruption.",
                  type: "error",
                  actionUrl: "/protected/settings/billing",
                  metadata: {
                    invoiceId: failedInvoice.id,
                    subscriptionId: failedInvoice.subscription,
                    eventId: event.id,
                    eventType: event.type,
                  },
                });

              if (notificationError) {
                console.error("❌ Error creating payment failed notification:", notificationError);
              } else {
                console.log("✅ Payment failed notification created successfully");
              }
            }
          }
        }
        break;

      case "customer.subscription.past_due":
        const pastDueSubscription = (event as any).data.object;
        console.log(`Processing customer.subscription.past_due: ${pastDueSubscription.id}`);
        
        // Update subscription status
        const { error: pastDueError } = await supabase
          .from("subscriptions")
          .update({
            subscriptionStatus: "past_due",
            stripeMetadata: {
              eventId: (event as any).id,
              eventType: (event as any).type,
            },
          })
          .eq("stripeSubscriptionId", pastDueSubscription.id);

        if (pastDueError) {
          console.error("❌ Error updating past due subscription:", pastDueError);
        }

        // Update organization status
        const pastDueOrgMetadata = pastDueSubscription.metadata;
        if (pastDueOrgMetadata?.userId) {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("organizationId")
            .eq("profile_id", pastDueOrgMetadata.userId)
            .single();

          if (userProfile?.organizationId) {
            // Update organization
            await supabase
              .from("organization")
              .update({
                subscriptionStatus: "past_due",
              })
              .eq("id", userProfile.organizationId);

            // Create past due notification
            await supabase
              .from("notifications")
              .insert({
                organizationId: userProfile.organizationId,
                userId: pastDueOrgMetadata.userId,
                title: "Account past due",
                message: "Your account is past due. Please update your payment to restore full access.",
                type: "warning",
                actionUrl: "/protected/settings/billing",
                metadata: {
                  subscriptionId: pastDueSubscription.id,
                  eventId: (event as any).id,
                  eventType: (event as any).type,
                },
              });
          }
        }
        break;

      case "product.created":
        const product = event.data.object as Stripe.Product;
        console.log(`Processing product.created: ${product.id} - ${product.name}`);
        
        const { error: productError } = await supabase
          .from("products")
          .upsert({
            stripeProductId: product.id,
            name: product.name,
            description: product.description || null,
            metadata: {
              ...product.metadata,
              eventId: event.id,
              eventType: event.type,
              created_at: new Date().toISOString(),
            },
            isActive: product.active,
          }, {
            onConflict: "stripeProductId"
          });

        if (productError) {
          console.error("❌ Error creating product:", productError);
        } else {
          console.log(`✅ Product created successfully: ${product.name}`);
        }
        break;

      case "product.updated":
        const updatedProduct = event.data.object as Stripe.Product;
        console.log(`Processing product.updated: ${updatedProduct.id} - ${updatedProduct.name}`);
        
        const { error: productUpdateError } = await supabase
          .from("products")
          .update({
            name: updatedProduct.name,
            description: updatedProduct.description || null,
            metadata: {
              ...updatedProduct.metadata,
              eventId: event.id,
              eventType: event.type,
              updated_at: new Date().toISOString(),
            },
            isActive: updatedProduct.active,
          })
          .eq("stripeProductId", updatedProduct.id);

        if (productUpdateError) {
          console.error("❌ Error updating product:", productUpdateError);
        } else {
          console.log(`✅ Product updated successfully: ${updatedProduct.name}`);
        }
        break;

      case "product.deleted":
        const deletedProduct = event.data.object as Stripe.Product;
        console.log(`Processing product.deleted: ${deletedProduct.id}`);
        
        const { error: productDeleteError } = await supabase
          .from("products")
          .update({
            isActive: false,
            metadata: {
              eventId: event.id,
              eventType: event.type,
              deletedAt: new Date().toISOString(),
            },
          })
          .eq("stripeProductId", deletedProduct.id);

        if (productDeleteError) {
          console.error("❌ Error deleting product:", productDeleteError);
        } else {
          console.log(`✅ Product deleted successfully: ${deletedProduct.id}`);
        }
        break;


        case "price.created":
            const price = event.data.object as Stripe.Price;
            console.log(`Processing price.created: ${price.id} for product ${price.product}`);
        
        // Resolve the Stripe product ID
        const productId = typeof price.product === "string" ? price.product : (price.product as Stripe.Product).id;

        // Try to find local product row; if missing, create it from Stripe product
        let productRowId: string | null = null;
        const { data: productData, error: productLookupError } = await supabase
          .from("products")
          .select("id")
          .eq("stripeProductId", productId)
          .maybeSingle?.() as any || await supabase
          .from("products")
          .select("id")
          .eq("stripeProductId", productId)
          .single();

        if (!productLookupError && productData) {
          productRowId = (productData as any).id;
        } else {
          try {
            // Fetch product from Stripe and upsert into local products table
            const sp = await stripe.products.retrieve(productId);
            const { data: upsertedProduct, error: upsertErr } = await supabase
              .from("products")
              .upsert({
                stripeProductId: sp.id,
                name: sp.name,
                description: sp.description || null,
                metadata: {
                  ...sp.metadata,
                  eventId: event.id,
                  eventType: event.type,
                  created_at: new Date().toISOString(),
                },
                isActive: sp.active,
              }, { onConflict: "stripeProductId" })
              .select("id")
              .single();

            if (upsertErr) {
              console.error("❌ Error upserting product for price:", upsertErr);
              break;
            }
            productRowId = upsertedProduct?.id || null;
          } catch (fetchErr) {
            console.error("❌ Unable to fetch Stripe product for price:", fetchErr);
            break;
          }
        }

        if (!productRowId) {
          console.error("❌ No product row ID resolved for price", price.id);
          break;
        }

        // Upsert price now that we have a product row
        const { error: priceError } = await supabase
          .from("pricing")
          .upsert({
            stripePriceId: price.id,
            productId: productRowId,
            stripeProductId: productId,
            currency: price.currency,
            unitAmount: price.unit_amount || 0,
            billingCycle: price.recurring?.interval === "month" ? "monthly" : 
                         price.recurring?.interval === "year" ? "yearly" : "monthly",
            metadata: {
              eventId: event.id,
              eventType: event.type,
              created_at: new Date().toISOString(),
            },
            isActive: price.active,
          }, { onConflict: "stripePriceId" });

        if (priceError) {
          console.error("❌ Error creating price:", priceError);
        } else {
          console.log(`✅ Price created successfully: ${price.id}`);
        }
        break;

      case "price.updated":
        const updatedPrice = event.data.object as Stripe.Price;
        console.log(`Processing price.updated: ${updatedPrice.id}`);
        
        const { error: priceUpdateError } = await supabase
          .from("pricing")
          .update({
            currency: updatedPrice.currency,
            unitAmount: updatedPrice.unit_amount || 0,
            billingCycle: updatedPrice.recurring?.interval === "month" ? "monthly" : 
                         updatedPrice.recurring?.interval === "year" ? "yearly" : "monthly",
            metadata: {
              eventId: event.id,
              eventType: event.type,
              updated_at: new Date().toISOString(),
            },
            isActive: updatedPrice.active,
          })
          .eq("stripePriceId", updatedPrice.id);

        if (priceUpdateError) {
          console.error("❌ Error updating price:", priceUpdateError);
        } else {
          console.log(`✅ Price updated successfully: ${updatedPrice.id}`);
        }
        break;

      case "price.deleted":
        const deletedPrice = event.data.object as Stripe.Price;
        console.log(`Processing price.deleted: ${deletedPrice.id}`);
        
        const { error: priceDeleteError } = await supabase
          .from("pricing")
          .update({
            isActive: false,
            metadata: {
              eventId: event.id,
              eventType: event.type,
              deletedAt: new Date().toISOString(),
            },
          })
          .eq("stripePriceId", deletedPrice.id);

        if (priceDeleteError) {
          console.error("❌ Error deleting price:", priceDeleteError);
        } else {
          console.log(`✅ Price deleted successfully: ${deletedPrice.id}`);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    console.log(`✅ Webhook processed successfully: ${event.type}`);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
} 