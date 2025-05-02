import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { 
  CompoundingFrequency, 
  calculateMissingPrincipal,
  calculateMissingFinalAmount,
  calculateMissingRate,
  calculateMissingTime,
  formatCurrency,
  saveCalculation,
  calculateCompoundInterest
} from "@/utils/calculatorUtils";
import { supabase } from "@/integrations/supabase/client";

interface MissingValueCalculatorProps {
  onCalculate: (params: {
    principal: number;
    rate: number;
    time: number;
    frequency: CompoundingFrequency;
    finalAmount: number;
  }, solveFor: 'principal' | 'rate' | 'time' | 'finalAmount') => void;
  solveFor: 'principal' | 'rate' | 'time' | 'finalAmount';
  setSolveFor: (solveFor: 'principal' | 'rate' | 'time' | 'finalAmount') => void;
}

interface NumericValues {
  principal: number | null;
  rate: number | null;
  time: number | null;
  finalAmount: number | null;
  frequency: CompoundingFrequency;
}

interface StoredValues {
  principal: string;
  rate: string;
  time: string;
  frequency: CompoundingFrequency;
  finalAmount: string;
}

const STORAGE_KEY = 'missingValueCalculator';

const SAMPLE_VALUES: StoredValues = {
  principal: "1000",
  rate: "5",
  time: "2",
  frequency: "monthly",
  finalAmount: "1100"
};

function cleanNumberInput(input: string): string {
  // Remove all non-numeric, non-decimal, non-minus characters
  return input.replace(/[^0-9.-]/g, '');
}

const solveOptions = [
  { value: 'principal', label: 'Principal (P)' },
  { value: 'rate', label: 'Annual Interest Rate (r)' },
  { value: 'time', label: 'Time Period (t)' },
  { value: 'finalAmount', label: 'Future Value (A)' },
];

export function MissingValueCalculator({ onCalculate, solveFor, setSolveFor }: MissingValueCalculatorProps) {
  const [values, setValues] = useState<StoredValues>(() => {
    // On mount, set sample values except for the field being solved for
    const initial = { ...SAMPLE_VALUES };
    initial[solveFor] = "";
    return initial;
  });
  const { toast } = useToast();

  // When solveFor changes, set sample values and clear the field to solve for
  useEffect(() => {
    setValues(prev => {
      const newValues = { ...SAMPLE_VALUES };
      newValues[solveFor] = "";
      return newValues;
    });
  }, [solveFor]);

  // Save values to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [values]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFrequencyChange = (value: string) => {
    setValues(prev => ({
      ...prev,
      frequency: value as CompoundingFrequency
    }));
  };

  const handleSolveForChange = (value: string) => {
    setSolveFor(value as 'principal' | 'rate' | 'time' | 'finalAmount');
    // Optionally clear the field to be solved for
    setValues(prev => ({ ...prev, [value]: "" }));
  };

  const formatResult = (value: number, field: keyof NumericValues): string => {
    switch (field) {
      case 'principal':
      case 'finalAmount':
        return formatCurrency(value);
      case 'rate':
        return value.toFixed(2) + '%';
      case 'time':
        return value.toFixed(2) + ' years';
      default:
        return value.toString();
    }
  };

  const calculateMissingValue = async () => {
    // Prevent calculation if any required field is empty
    const requiredFields = ['principal', 'rate', 'time', 'finalAmount'].filter(f => f !== solveFor);
    for (const field of requiredFields) {
      if (!values[field as keyof StoredValues] || values[field as keyof StoredValues].trim() === '') {
        toast({
          title: "Missing Input",
          description: <code style={{ whiteSpace: 'pre-wrap' }}>Please fill in all required fields before calculating.</code>,
          variant: "destructive"
        });
        return;
      }
    }
    // Clean and parse all non-empty values
    const numericValues: NumericValues = {
      principal: solveFor !== 'principal' && values.principal.trim() !== "" && !isNaN(Number(cleanNumberInput(values.principal))) ? parseFloat(cleanNumberInput(values.principal)) : null,
      rate: solveFor !== 'rate' && values.rate.trim() !== "" && !isNaN(Number(cleanNumberInput(values.rate))) ? parseFloat(cleanNumberInput(values.rate)) : null,
      time: solveFor !== 'time' && values.time.trim() !== "" && !isNaN(Number(cleanNumberInput(values.time))) ? parseFloat(cleanNumberInput(values.time)) : null,
      finalAmount: solveFor !== 'finalAmount' && values.finalAmount.trim() !== "" && !isNaN(Number(cleanNumberInput(values.finalAmount))) ? parseFloat(cleanNumberInput(values.finalAmount)) : null,
      frequency: values.frequency
    };

    // Validate required fields
    for (const [key, value] of Object.entries(numericValues)) {
      if (key !== 'frequency' && key !== solveFor && (value === null || isNaN(value))) {
        toast({
          title: "Invalid Input",
          description: <code style={{ whiteSpace: 'pre-wrap' }}>{`Please enter a valid number for ${key}.`}</code>,
          variant: "destructive"
        });
        return;
      }
      if (key !== 'frequency' && key !== solveFor && value !== null && value < 0) {
        toast({
          title: "Invalid Input",
          description: <code style={{ whiteSpace: 'pre-wrap' }}>{`Please enter a non-negative number for ${key}.`}</code>,
          variant: "destructive"
        });
        return;
      }
    }

    let result: number;
    let resultField: keyof NumericValues = solveFor;

    // Calculate the selected variable
    if (solveFor === 'principal') {
      result = calculateMissingPrincipal(
        numericValues.finalAmount!,
        numericValues.rate!,
        numericValues.time!,
        numericValues.frequency
      );
      setValues(prev => ({ ...prev, principal: formatResult(result, resultField) }));
    } else if (solveFor === 'finalAmount') {
      result = calculateMissingFinalAmount(
        numericValues.principal!,
        numericValues.rate!,
        numericValues.time!,
        numericValues.frequency
      );
      setValues(prev => ({ ...prev, finalAmount: formatResult(result, resultField) }));
    } else if (solveFor === 'rate') {
      result = calculateMissingRate(
        numericValues.principal!,
        numericValues.finalAmount!,
        numericValues.time!,
        numericValues.frequency
      );
      setValues(prev => ({ ...prev, rate: formatResult(result, resultField) }));
    } else if (solveFor === 'time') {
      result = calculateMissingTime(
        numericValues.principal!,
        numericValues.finalAmount!,
        numericValues.rate!,
        numericValues.frequency
      );
      setValues(prev => ({ ...prev, time: formatResult(result, resultField) }));
    }

    // Prepare calculation params for saving
    const params = {
      principal: values.principal.trim() === "" ? null : parseFloat(values.principal),
      rate: values.rate.trim() === "" ? null : parseFloat(values.rate),
      time: values.time.trim() === "" ? null : parseFloat(values.time),
      frequency: values.frequency,
      startDate: null
    };
    const resultObj = calculateCompoundInterest(params as any);

    // Save to history (local + Supabase)
    await saveCalculation(params, resultObj);

    // Notify parent (if needed)
    onCalculate({ ...params, finalAmount: resultObj.finalAmount }, solveFor);

    toast({
      title: "Calculation Complete",
      description: `The missing value has been calculated: ${formatResult(result!, resultField!)}`,
    });
  };

  const resetFields = () => {
    setValues({
      principal: "",
      rate: "",
      time: "",
      frequency: "annually",
      finalAmount: ""
    });
    // Clear localStorage when resetting
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Fields Reset",
      description: "All fields have been cleared.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Compute Missing Value</CardTitle>
        <CardDescription>
          Select which value you want to calculate, then fill in the other fields.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="mb-4">
            <Label htmlFor="solveFor">I want to calculate:</Label>
            <Select value={solveFor} onValueChange={handleSolveForChange}>
              <SelectTrigger id="solveFor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {solveOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Principal Amount (₱)</Label>
              <Input
                id="principal"
                name="principal"
                type="number"
                min="0"
                step="100"
                value={values.principal}
                onChange={handleChange}
                className="finance-input"
                placeholder="Enter principal"
                disabled={solveFor === 'principal'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Annual Interest Rate (%)</Label>
              <Input
                id="rate"
                name="rate"
                type="number"
                min="0"
                step="0.01"
                value={values.rate}
                onChange={handleChange}
                className="finance-input"
                placeholder="Enter rate"
                disabled={solveFor === 'rate'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time Period (Years)</Label>
              <Input
                id="time"
                name="time"
                type="number"
                min="0"
                step="0.01"
                value={values.time}
                onChange={handleChange}
                className="finance-input"
                placeholder="Enter time"
                disabled={solveFor === 'time'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finalAmount">Future Value (₱)</Label>
              <Input
                id="finalAmount"
                name="finalAmount"
                type="number"
                min="0"
                step="100"
                value={values.finalAmount}
                onChange={handleChange}
                className="finance-input"
                placeholder="Enter future value"
                disabled={solveFor === 'finalAmount'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Compounding Frequency</Label>
              <Select 
                value={values.frequency} 
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger id="frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annually">Annually</SelectItem>
                  <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="continuously">Continuously</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-4">
            <Button 
              type="button" 
              className="flex-1 finance-btn"
              onClick={calculateMissingValue}
            >
              Calculate Missing Value
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={resetFields}
            >
              Reset All Fields
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 