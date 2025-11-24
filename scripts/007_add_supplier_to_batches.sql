-- Add supplier_id column to purchase_batches table
ALTER TABLE purchase_batches
ADD COLUMN supplier_id UUID REFERENCES suppliers(id);

-- Add index for better query performance
CREATE INDEX idx_purchase_batches_supplier ON purchase_batches(supplier_id);
