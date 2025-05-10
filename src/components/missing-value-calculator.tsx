/**
 * MissingValueCalculator Component
 * 
 * A specialized calculator that allows users to solve for any one of the four main variables
 * in compound interest calculations:
 * - Principal (P): Initial investment amount
 * - Rate (r): Annual interest rate
 * - Time (t): Investment period in years
 * - Final Amount (A): Future value of the investment
 * 
 * Features:
 * - Dynamic form that disables the field being solved for
 * - Input validation and error handling
 * - Local storage persistence
 * - Responsive design
 * - Detailed calculation steps
 */

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
  calculateCompoundInterest,
  CalculationParams,
  getFormula
} from "@/utils/calculatorUtils";
import { supabase } from "@/integrations/supabase/client";

/**
 * Props interface for the MissingValueCalculator component
 * @property onCalculate - Callback function that receives calculation parameters and the solved value
 * @property solveFor - The variable currently being solved for
 * @property setSolveFor - Function to update which variable to solve for
 */
interface MissingValueCalculatorProps {
  onCalculate: (params: CalculationParams, solveFor: string) => void;
  solveFor: string;
  setSolveFor: (value: string) => void;
}

/**
 * Interface for numeric values used in calculations
 * All fields are nullable except frequency
 */
interface NumericValues {
  principal: number | null;
  rate: number | null;
  time: number | null;
  finalAmount: number | null;
  frequency: CompoundingFrequency;
  timeUnit: 'years' | 'days';
}

/**
 * Interface for stored form values
 * All fields are strings except frequency
 */
interface StoredValues {
  principal: string;
  rate: string;
  time: string;
  timeUnit: 'years' | 'days';
  finalAmount: string;
  frequency: CompoundingFrequency;
}

// Storage key for persisting form values
const STORAGE_KEY = 'missingValueCalculator';

// Default values for the form
const SAMPLE_VALUES: StoredValues = {
  principal: "",
  rate: "",
  time: "",
  timeUnit: "years",
  finalAmount: "",
  frequency: "monthly"
};

/**
 * Cleans numeric input by removing non-numeric characters
 * @param input - The input string to clean
 * @returns Cleaned numeric string
 */
function cleanNumberInput(input: string): string {
  return input.replace(/[^0-9.-]/g, '');
}

// Available options for what to solve for
const solveOptions = [
  { value: 'principal', label: 'Principal (P)' },
  { value: 'rate', label: 'Annual Interest Rate (r)' },
  { value: 'time', label: 'Time Period (t)' }
];

export function MissingValueCalculator({ onCalculate, solveFor, setSolveFor }: MissingValueCalculatorProps) {
  // Initialize form state
  const [values, setValues] = useState<StoredValues>(() => {
    const savedValues = localStorage.getItem('missingValueParams');
    return savedValues ? JSON.parse(savedValues) : {
      principal: '',
      rate: '',
      time: '',
      timeUnit: 'years',
      finalAmount: '',
      frequency: 'annually'
    };
  });
  const { toast } = useToast();

  // Reset the field being solved for when solveFor changes
  useEffect(() => {
    setValues(prev => {
      const newValues = { ...SAMPLE_VALUES };
      newValues[solveFor] = "";
      return newValues;
    });
  }, [solveFor]);

  // Persist form values to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [values]);

  /**
   * Handles changes to input fields
   * Cleans numeric input and updates state
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value === '' ? '' : cleanNumberInput(value)
    }));
  };

  /**
   * Updates compounding frequency when user selects a new option
   */
  const handleFrequencyChange = (value: string) => {
    setValues(prev => ({
      ...prev,
      frequency: value as CompoundingFrequency
    }));
  };

  /**
   * Updates which variable to solve for
   * Clears the field that will be calculated
   */
  const handleSolveForChange = (value: string) => {
    setSolveFor(value);
    setValues(prev => ({ ...prev, [value]: "" }));
  };

  /**
   * Formats the calculation result based on the field type
   * @param value - The calculated value
   * @param field - The field being calculated
   * @returns Formatted string representation of the value
   */
  const formatResult = (value: number, field: keyof NumericValues): string => {
    switch (field) {
      case 'principal':
      case 'finalAmount':
        return formatCurrency(value);
      case 'rate':
        return value.toFixed(2) + '%';
      case 'time':
        return value.toFixed(2) + (values.timeUnit === 'days' ? ' days' : ' years');
      default:
        return value.toString();
    }
  };

  /**
   * Handles the calculation process
   * Validates inputs and performs the appropriate calculation
   */
  const handleCalculate = async () => {
    // Validate required fields
    const requiredFields = ['principal', 'rate', 'time'].filter(f => f !== solveFor);
    for (const field of requiredFields) {
      if (!values[field as keyof StoredValues] || values[field as keyof StoredValues].trim() === '') {
        toast({
          title: "Missing Input",
          description: "Please fill in all required fields before calculating.",
          variant: "destructive"
        });
        return;
      }
    }

    // Parse numeric values
    const numericValues = {
      principal: solveFor !== 'principal' ? Number(cleanNumberInput(values.principal)) : null,
      rate: solveFor !== 'rate' ? Number(cleanNumberInput(values.rate)) : null,
      time: solveFor !== 'time' ? Number(cleanNumberInput(values.time)) : null,
      finalAmount: Number(cleanNumberInput(values.finalAmount)),
      frequency: values.frequency,
      timeUnit: values.timeUnit
    };

    let result: number;
    const params: CalculationParams = {
      principal: numericValues.principal!,
      rate: numericValues.rate!,
      time: numericValues.time!,
      frequency: numericValues.frequency,
      timeUnit: numericValues.timeUnit,
      targetAmount: numericValues.finalAmount
    };

    switch (solveFor) {
      case 'principal':
        result = calculateMissingPrincipal(
          numericValues.finalAmount,
          numericValues.rate!,
          numericValues.time!,
          numericValues.frequency,
          numericValues.timeUnit
        );
        break;
      case 'rate':
        result = calculateMissingRate(
          numericValues.principal!,
          numericValues.finalAmount,
          numericValues.time!,
          numericValues.frequency,
          numericValues.timeUnit
        );
        break;
      case 'time':
        result = calculateMissingTime(
          numericValues.principal!,
          numericValues.finalAmount,
          numericValues.rate!,
          numericValues.frequency,
          numericValues.timeUnit
        );
        break;
      default:
        result = calculateMissingFinalAmount(
          numericValues.principal!,
          numericValues.rate!,
          numericValues.time!,
          numericValues.frequency,
          numericValues.timeUnit
        );
    }

    // Save calculation to history
    await saveCalculation(params, {
      finalAmount: result,
      totalInterest: result - numericValues.principal!,
      yearlyBreakdown: [],
      formula: getFormula(numericValues.frequency, solveFor)
    });

    // Show result
    toast({
      title: "Calculation Complete",
      description: `The ${solveFor} is ${formatResult(result, solveFor as keyof NumericValues)}`,
    });

    // Call the onCalculate callback
    onCalculate(params, solveFor);
  };

  /**
   * Resets all form fields to their default values
   */
  const resetFields = () => {
    setValues({
      principal: "",
      rate: "",
      time: "",
      timeUnit: "years",
      finalAmount: "",
      frequency: "annually"
    });
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
              <Label htmlFor="time">Time Period</Label>
              <div className="flex gap-2">
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
                <Select 
                  value={values.timeUnit} 
                  onValueChange={(value: 'years' | 'days') => setValues(prev => ({ ...prev, timeUnit: value }))}
                  disabled={solveFor === 'time'}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="years">Years</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="finalAmount">Compound Interest (CI)</Label>
              <Input
                id="finalAmount"
                name="finalAmount"
                type="number"
                min="0"
                step="100"
                value={values.finalAmount}
                onChange={handleChange}
                className="finance-input"
                placeholder="Enter compound interest"
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
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-4">
            <Button 
              type="button" 
              className="flex-1 finance-btn"
              onClick={handleCalculate}
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