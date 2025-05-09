-- Create calculations table
CREATE TABLE IF NOT EXISTS calculations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    principal DECIMAL NOT NULL,
    rate DECIMAL NOT NULL,
    time INTEGER NOT NULL,
    frequency TEXT NOT NULL,
    day_count_method TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    final_amount DECIMAL NOT NULL,
    total_interest DECIMAL NOT NULL,
    formula TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS calculations_created_at_idx ON calculations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations" ON calculations
    FOR ALL
    USING (true)
    WITH CHECK (true); 