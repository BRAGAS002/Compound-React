import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalculationParams, CompoundingFrequency, calculateCompoundInterest, saveCalculation } from "@/utils/calculatorUtils";
import { useToast } from "@/components/ui/use-toast";

interface CalculatorFormProps {
  onCalculate: (params: CalculationParams) => void;
}

export function CalculatorForm({ onCalculate }: CalculatorFormProps) {
  const [params, setParams] = useState<CalculationParams>(() => {
    // Load saved params from localStorage or use defaults
    const savedParams = localStorage.getItem('calculatorParams');
    return savedParams ? JSON.parse(savedParams) : {
      principal: 10000,
      rate: 5,
      time: 10,
      frequency: 'annually',
      startDate: null
    };
  });

  const [includeDate, setIncludeDate] = useState(false);

  // Save params to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('calculatorParams', JSON.stringify(params));
  }, [params]);

  // Update startDate when includeDate changes
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: name === 'startDate' ? new Date(value) : parseFloat(value) || 0
    }));
  };

  const handleFrequencyChange = (value: string) => {
    setParams(prev => ({
      ...prev,
      frequency: value as CompoundingFrequency
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (params.principal <= 0) {
      toast({
        title: "Invalid Principal",
        description: "Principal amount must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (params.rate <= 0) {
      toast({
        title: "Invalid Interest Rate",
        description: "Interest rate must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (params.time <= 0 || !Number.isInteger(params.time)) {
      toast({
        title: "Invalid Time Period",
        description: "Time period must be a positive integer",
        variant: "destructive"
      });
      return;
    }

    const result = calculateCompoundInterest(params);
    saveCalculation(params, result);
    onCalculate(params);

    toast({
      title: "Calculation Complete",
      description: "Your compound interest has been calculated successfully.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Compound Interest Calculator</CardTitle>
        <CardDescription>
          Calculate how your investments will grow over time with compound interest.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Principal Amount (₱)</Label>
              <Input
                id="principal"
                name="principal"
                type="number"
                min="0"
                step="100"
                value={params.principal}
                onChange={handleChange}
                className="finance-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Annual Interest Rate (%)</Label>
              <Input
                id="rate"
                name="rate"
                type="number"
                min="0"
                step="0.1"
                value={params.rate}
                onChange={handleChange}
                className="finance-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time Period (Years)</Label>
              <Input
                id="time"
                name="time"
                type="number"
                min="1"
                step="1"
                value={params.time}
                onChange={handleChange}
                className="finance-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Compounding Frequency</Label>
              <Select 
                value={params.frequency} 
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

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDate"
                  checked={includeDate}
                  onCheckedChange={(checked) => setIncludeDate(checked as boolean)}
                />
                <Label htmlFor="includeDate">Include Start Date</Label>
              </div>
              {includeDate && (
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={params.startDate ? params.startDate.toISOString().split('T')[0] : ''}
                  onChange={handleChange}
                  className="finance-input"
                />
              )}
            </div>
          </div>

          <Button type="submit" className="w-full finance-btn">
            Calculate
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
