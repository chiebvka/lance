-- Function to efficiently update default bank
CREATE OR REPLACE FUNCTION update_default_bank(p_organization_id UUID, p_bank_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update all banks in the organization to not be default
  UPDATE banks 
  SET "isDefault" = false 
  WHERE "organizationId" = p_organization_id;
  
  -- Set the specified bank as default
  UPDATE banks 
  SET "isDefault" = true 
  WHERE id = p_bank_id AND "organizationId" = p_organization_id;
  
  -- Update the organization's defaultBankId
  UPDATE organization 
  SET "defaultBankId" = p_bank_id 
  WHERE id = p_organization_id;
END;
$$ LANGUAGE plpgsql; 