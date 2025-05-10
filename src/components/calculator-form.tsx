/**
 * CalculatorForm Component
 * 
 * A form component for compound interest calculations that allows users to:
 * - Input principal amount, interest rate, time period, and compounding frequency
 * - Optionally include a start date for the calculation
 * - Save calculations to history
 * - Reset form fields
 * 
 * The component handles:
 * - Form validation
 * - Local storage persistence
 * - Toast notifications for user feedback
 * - Responsive design for different screen sizes
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalculationParams, CompoundingFrequency, calculateCompoundInterest, saveCalculation } from "@/utils/calculatorUtils";
import { useToast } from "@/components/ui/use-toast";

/**
 * Props interface for the CalculatorForm component
 * @property onCalculate - Callback function that receives calculation parameters when form is submitted
 */
interface CalculatorFormProps {
  onCalculate: (params: CalculationParams) => void;
}

/**
 * CalculatorForm Component
 * 
 * A form for compound interest calculations with:
 * - Input fields for principal, rate, time, and frequency
 * - Optional start date
 * - Form validation
 * - Saves to local storage
 * - Reset button
 */
export function CalculatorForm({ onCalculate }: CalculatorFormProps) {
  // Initialize form state with saved values from localStorage or defaults
  const [params, setParams] = useState<CalculationParams>(() => {
    const savedParams = localStorage.getItem('calculatorParams');
    return savedParams ? JSON.parse(savedParams) : {
      principal: "",
      rate: "",
      time: "",
      frequency: 'annually',
      startDate: null
    };
  });

  // State to control whether start date input is shown
  const [includeDate, setIncludeDate] = useState(false);

  // Save form values to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('calculatorParams', JSON.stringify(params));
  }, [params]);

  // Handle start date toggle
  useEffect(() => {
    if (includeDate) {
      setParams(prev => ({
        ...prev,
        startDate: new Date()
      }));
    } else {
      setParams(prev => ({
        ...prev,
        startDate: null
      }));
    }
  }, [includeDate]);

  const { toast } = useToast();

  /**
   * Handles changes to numeric input fields
   * Converts empty strings to empty values, otherwise parses as float
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: name === 'startDate' ? new Date(value) : value === '' ? '' : parseFloat(value)
    }));
  };

  /**
   * Updates the compounding frequency when user selects a new option
   */
  const handleFrequencyChange = (value: string) => {
    setParams(prev => ({
      ...prev,
      frequency: value as CompoundingFrequency
    }));
  };

  /**
   * Handles form submission
   * Validates inputs and performs calculation if valid
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate principal amount
    if (params.principal <= 0) {
      toast({
        title: "Invalid Principal",
        description: "Principal amount must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    // Validate interest rate
    if (params.rate <= 0) {
      toast({
        title: "Invalid Interest Rate",
        description: "Interest rate must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    // Add maximum rate validation
    if (params.rate > 100) {
      toast({
        title: "Invalid Interest Rate",
        description: "Interest rate cannot exceed 100%",
        variant: "destructive"
      });
      return;
    }

    // Validate time period
    if (params.time <= 0 || !Number.isInteger(params.time)) {
      toast({
        title: "Invalid Time Period",
        description: "Time period must be a positive integer",
        variant: "destructive"
      });
      return;
    }

    // Calculate and save results
    const result = calculateCompoundInterest(params);
    await saveCalculation(params, result);
    onCalculate(params);
    
    // Show success notification
    toast({
      title: "Calculation Complete",
      description: "Your calculation has been saved to history.",
    });
  };

  // Render the form UI
  return (
    <Card className="w-full">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">Compound Interest Calculator</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Calculate how your investments will grow over time with compound interest to determine the Compound Interest (CI).
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Principal Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="principal" className="text-sm sm:text-base">Principal Amount (₱)</Label>
              <Input
                id="principal"
                name="principal"
                type="number"
                min="0"
                step="100"
                value={params.principal}
                onChange={handleChange}
                className="finance-input h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>

            {/* Interest Rate Input */}
            <div className="space-y-2">
              <Label htmlFor="rate" className="text-sm sm:text-base">Annual Interest Rate (%)</Label>
              <Input
                id="rate"
                name="rate"
                type="number"
                min="0"
                step="0.1"
                value={params.rate}
                onChange={handleChange}
                className="finance-input h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>

            {/* Time Period Input */}
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm sm:text-base">Time Period</Label>
              <div className="flex gap-2">
                <Input
                  id="time"
                  name="time"
                  type="number"
                  min="1"
                  step="1"
                  value={params.time}
                  onChange={handleChange}
                  className="finance-input h-10 sm:h-11 text-sm sm:text-base"
                />
                <Select 
                  value={params.timeUnit || 'years'} 
                  onValueChange={(value) => setParams(prev => ({ ...prev, timeUnit: value }))}
                >
                  <SelectTrigger className="w-[100px] h-10 sm:h-11 text-sm sm:text-base">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="years">Years</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Compounding Frequency Select */}
            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-sm sm:text-base">Compounding Frequency</Label>
              <Select 
                value={params.frequency} 
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger id="frequency" className="h-10 sm:h-11 text-sm sm:text-base">
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

            {/* Optional Start Date Section */}
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDate"
                  checked={includeDate}
                  onCheckedChange={(checked) => setIncludeDate(checked as boolean)}
                />
                <Label htmlFor="includeDate" className="text-sm sm:text-base">Include Start Date</Label>
              </div>
              {includeDate && (
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={params.startDate ? params.startDate.toISOString().split('T')[0] : ''}
                  onChange={handleChange}
                  className="finance-input h-10 sm:h-11 text-sm sm:text-base"
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="submit" className="w-full sm:flex-1 finance-btn h-10 sm:h-11 text-sm sm:text-base">
              Calculate
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1 h-10 sm:h-11 text-sm sm:text-base"
              onClick={() => {
                setParams({
                  principal: "" as any,
                  rate: "" as any,
                  time: "" as any,
                  frequency: "" as any,
                  startDate: null
                });
                toast({
                  title: "Fields Reset",
                  description: "All fields have been cleared.",
                });
              }}
            >
              Reset All Fields
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
