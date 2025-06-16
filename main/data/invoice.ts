import { customers } from "./customer"

export interface Invoice {
  value: string
  label: string
  customerId: string
}

const pad = (num: number, size: number) => ("00000" + num).slice(size * -1)

export const invoices: Invoice[] = Array.from({ length: 40 }, (_, i) => {
  const customerIndex = i % customers.length
  const customer = customers[customerIndex]
  return {
    value: `INV${pad(i + 1, 5)}`,
    label: `INV${pad(i + 1, 5)}. ${customer.name}`,
    customerId: customer.id,
  }
})
