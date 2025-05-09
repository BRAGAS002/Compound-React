/**
 * ResultsDisplay Component
 * 
 * Displays the results of compound interest calculations in three tabs:
 * 1. Summary - Shows key numbers like principal, final amount, and interest earned
 * 2. Table - Detailed breakdown of the investment growth over time
 * 3. Formula - Shows the mathematical formula used and step-by-step calculations
 * 
 * Table Calculation Formula:
 * For each period (payment number):
 * 1. Balance = P(1 + r/n)^(nt)
 *    where:
 *    - P = Principal amount
 *    - r = Annual interest rate (as decimal)
 *    - n = Number of compounds per year
 *    - t = Time period in years
 * 
 * 2. Interest Earned = Current Balance - Previous Balance
 *    (For first period, Previous Balance = Principal)
 * 
 * 3. Total Interest = Current Balance - Principal
 * 
 * Example for monthly compounding (n=12):
 * - Period 1: Balance = P(1 + r/12)^(12 × 1/12)
 * - Period 2: Balance = P(1 + r/12)^(12 × 2/12)
 * - Period 3: Balance = P(1 + r/12)^(12 × 3/12)
 * And so on...
 * 
 * Features:
 * - Responsive design for different screen sizes
 * - Dynamic formula display based on what was calculated
 * - Detailed breakdown table with optional date column
 * - Step-by-step calculation explanation
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalculationParams, CalculationResult, calculateCompoundInterest, formatCurrency } from "@/utils/calculatorUtils";

/**
 * Props interface for the ResultsDisplay component
 * @property params - The calculation parameters used to generate results
 * @property solveFor - Optional parameter indicating which value was solved for
 */
interface ResultsDisplayProps {
  params: CalculationParams | null;
  solveFor?: 'principal' | 'rate' | 'time' | 'finalAmount';
}

/**
 * Returns the appropriate formula string based on what we're solving for
 * @param solveFor - The value being solved for
 * @param frequency - The compounding frequency
 * @returns The formula string to display (as JSX)
 */
function getFormulaForSolveFor(solveFor: string | undefined, frequency: string): React.ReactNode {
  switch (solveFor) {
    // Formula for Principal
    case 'principal':
      return (
        <>
          P = <span>FV / (1 + r/n)<sup>nt</sup></span>
        </>
      );
    // Formula for Future Value (FV)
    case 'finalAmount':
      return (
        <>
          FV = <span>P(1 + r/n)<sup>nt</sup></span>
        </>
      );
    // Formula for Rate
    case 'rate':
      return (
        <>
          r = <span>n((FV/P)<sup>1/nt</sup> - 1)</span>
        </>
      );
    // Formula for Time
    case 'time':
      return (
        <>
          t = <span>ln(FV/P) / (n × ln(1 + r/n))</span>
        </>
      );
    // Default: Compound Interest (CI)
    default:
      return (
        <>
          CI = <span>P(1 + r/n)<sup>nt</sup> - P</span>
        </>
      );
  }
}

/**
 * Generates step-by-step calculation explanation
 * @param params - The calculation parameters
 * @param solveFor - The value being solved for
 * @returns Array of calculation steps with formatted values
 */
function getStepByStepCalculation(params: CalculationParams, solveFor: string | undefined): React.ReactNode[] {
  const { principal, rate, time, frequency } = params;
  const rateDecimal = rate / 100;
  const n = getFrequencyNumber(frequency);
  const finalAmount = params.targetAmount || calculateCompoundInterest(params).finalAmount;
  const nValue = Number(n);

  // Generate appropriate steps based on what we're solving for
  switch (solveFor) {
    case 'principal':
      return [
        <><b>P = FV / (1 + r/n)<sup>nt</sup></b></>,
        <>
          P = {formatCurrency(finalAmount)} / (1 + {rateDecimal.toFixed(4)}/{nValue})<sup>{nValue}×{time}</sup>
        </>,
        <>
          P = {formatCurrency(finalAmount)} / ({(1 + rateDecimal/nValue).toFixed(4)})<sup>{nValue * time}</sup>
        </>,
        <>
          P = {formatCurrency(finalAmount)} / {Math.pow(1 + rateDecimal/nValue, nValue * time).toFixed(4)}
        </>,
        <>
          P = {formatCurrency(principal)}
        </>
      ];
    case 'finalAmount':
      return [
        <><b>FV = P(1 + r/n)<sup>nt</sup></b></>,
        <>
          FV = {formatCurrency(principal)}(1 + {rateDecimal.toFixed(4)}/{nValue})<sup>{nValue}×{time}</sup>
        </>,
        <>
          FV = {formatCurrency(principal)}({(1 + rateDecimal/nValue).toFixed(4)})<sup>{nValue * time}</sup>
        </>,
        <>
          FV = {formatCurrency(principal)} × {Math.pow(1 + rateDecimal/nValue, nValue * time).toFixed(4)}
        </>,
        <>
          FV = {formatCurrency(finalAmount)}
        </>
      ];
    case 'rate':
      return [
        <><b>r = n((FV/P)<sup>1/nt</sup> - 1)</b></>,
        <>
          r = {nValue}(( {formatCurrency(finalAmount)}/{formatCurrency(principal)} )<sup>1/({nValue}×{time})</sup> - 1)
        </>,
        <>
          r = {nValue}(( {(finalAmount/principal).toFixed(4)} )<sup>1/{nValue * time}</sup> - 1)
        </>,
        <>
          r = {nValue}({Math.pow(finalAmount/principal, 1/(nValue * time)).toFixed(4)} - 1)
        </>,
        <>
          r = {(rateDecimal * 100).toFixed(2)}%
        </>
      ];
    case 'time':
      return [
        <><b>t = ln(FV/P) / (n × ln(1 + r/n))</b></>,
        <>
          t = ln({formatCurrency(finalAmount)}/{formatCurrency(principal)}) / ({nValue} × ln(1 + {rateDecimal.toFixed(4)}/{nValue}))
        </>,
        <>
          t = {Math.log(finalAmount/principal).toFixed(4)} / ({nValue} × {Math.log(1 + rateDecimal/nValue).toFixed(4)})
        </>,
        <>
          t = {Math.log(finalAmount/principal).toFixed(4)} / {(nValue * Math.log(1 + rateDecimal/nValue)).toFixed(4)}
        </>,
        <>
          t = {time} years
        </>
      ];
    default:
      const compoundInterest = finalAmount - principal;
      return [
        <><b>CI = P(1 + r/n)<sup>nt</sup> - P</b></>,
        <>
          CI = {formatCurrency(principal)}(1 + {rateDecimal.toFixed(4)}/{nValue})<sup>{nValue}×{time}</sup> - {formatCurrency(principal)}
        </>,
        <>
          CI = {formatCurrency(principal)}({(1 + rateDecimal/nValue).toFixed(4)})<sup>{nValue * time}</sup> - {formatCurrency(principal)}
        </>,
        <>
          CI = {formatCurrency(finalAmount)} - {formatCurrency(principal)}
        </>,
        <>
          CI = {formatCurrency(compoundInterest)}
        </>
      ];
  }
}

/**
 * ResultsDisplay Component
 * 
 * Shows calculation results in three tabs:
 * 1. Summary - Key numbers
 * 2. Year by Year - Detailed breakdown
 * 3. Formula - How it was calculated
 */
export function ResultsDisplay({ params, solveFor }: ResultsDisplayProps) {
  // Track results and validation
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [displayParams, setDisplayParams] = useState<CalculationParams | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update when inputs change
  useEffect(() => {
    if (params) {
      setIsLoading(true);
      // Check if inputs are valid
      const valid = 
        typeof params.principal === 'number' && !isNaN(params.principal) && params.principal >= 0 &&
        typeof params.rate === 'number' && !isNaN(params.rate) && params.rate >= 0 &&
        typeof params.time === 'number' && !isNaN(params.time) && params.time >= 0 &&
        typeof params.frequency === 'string' && params.frequency;

      setIsValid(valid);
      setDisplayParams(params);
      
      if (valid) {
        const calculatedResult = calculateCompoundInterest(params);
        setResult(calculatedResult);
      }
      setIsLoading(false);
    }
  }, [params]);

  if (!result || !displayParams) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-muted-foreground">Calculating results...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">Calculation Results</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {/* Results Tabs */}
        <Tabs defaultValue="summary" className="w-full">
          {/* Tab Navigation */}
          <TabsList className="mb-4 w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:gap-1">
            <TabsTrigger value="summary" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-1.5">Summary</TabsTrigger>
            <TabsTrigger value="breakdown" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-1.5">Table</TabsTrigger>
            <TabsTrigger value="formula" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-1.5">Formula</TabsTrigger>
          </TabsList>
          
          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Principal Amount */}
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-muted-foreground">Principal Amount</h3>
                <p className="text-xl sm:text-2xl font-bold">{formatCurrency(displayParams.principal)}</p>
              </div>
              {/* Final Amount */}
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-muted-foreground">Final Amount</h3>
                <p className="text-xl sm:text-2xl font-bold">{formatCurrency(result.finalAmount)}</p>
              </div>
              {/* Total Interest */}
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-muted-foreground">Total Interest Earned</h3>
                <p className="text-xl sm:text-2xl font-bold">{formatCurrency(result.totalInterest)}</p>
              </div>
              {/* Interest Ratio */}
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-muted-foreground">Interest to Principal Ratio</h3>
                <p className="text-xl sm:text-2xl font-bold">
                  {(result.totalInterest / displayParams.principal * 100).toFixed(2)}%
                </p>
              </div>
            </div>
            {/* Validation Message */}
            {!isValid && (
              <div className="text-xs sm:text-sm text-muted-foreground mt-2">
                Showing sample calculation. Please fill in all required fields for your own result.
              </div>
            )}
          </TabsContent>

          {/* Table Tab - Shows detailed breakdown */}
          <TabsContent value="breakdown">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Payment Number</TableHead>
                    {displayParams.startDate && <TableHead className="whitespace-nowrap">Date</TableHead>}
                    <TableHead className="whitespace-nowrap">Balance</TableHead>
                    <TableHead className="whitespace-nowrap">Interest Earned</TableHead>
                    <TableHead className="whitespace-nowrap">Total Interest</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.yearlyBreakdown.map((row) => {
                    // Calculate total interest earned up to this point
                    const totalInterestToDate = row.amount - displayParams.principal;
                    return (
                      <TableRow key={row.year}>
                        <TableCell className="whitespace-nowrap">{row.year}</TableCell>
                        {displayParams.startDate && <TableCell className="whitespace-nowrap">{row.date}</TableCell>}
                        <TableCell className="whitespace-nowrap">{formatCurrency(row.amount)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatCurrency(row.interestEarned)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatCurrency(totalInterestToDate)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Formula Tab */}
          <TabsContent value="formula" className="space-y-4">
            <div className="bg-muted p-4 sm:p-6 rounded-lg">
              {/* Formula Display */}
              <h3 className="text-base sm:text-lg font-medium mb-2">Formula Used:</h3>
              <p className="text-base sm:text-xl font-mono break-all">{getFormulaForSolveFor(solveFor, displayParams.frequency)}</p>
              
              {/* Variable Definitions */}
              <div className="mt-4 space-y-2 text-sm sm:text-base">
                <p><strong>Where:</strong></p>
                <p>CI = Compound Interest ({formatCurrency(result.finalAmount)})</p>
                <p>P = Principal ({formatCurrency(displayParams.principal)})</p>
                <p>r = Annual interest rate ({displayParams.rate}%)</p>
                <p>t = Time period ({displayParams.time} years)</p>
                {displayParams.frequency !== 'continuously' && (
                  <p>n = Number of times compounded per year ({getFrequencyNumber(displayParams.frequency)})</p>
                )}
              </div>

              {/* Step-by-Step Calculation */}
              <div className="mt-4 p-3 sm:p-4 bg-white dark:bg-gray-700 rounded-md">
                <h4 className="font-medium mb-2 text-sm sm:text-base">Step-by-Step Calculation:</h4>
                <div className="space-y-2">
                  {getStepByStepCalculation(displayParams, solveFor).map((step, index) => (
                    <p key={index} className="font-mono text-sm sm:text-base break-all">
                      {index === 0 ? 'Step 1: ' : index === 1 ? 'Step 2: ' : index === 2 ? 'Step 3: ' : index === 3 ? 'Step 4: ' : 'Step 5: '}{step}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * Converts compounding frequency to number of compounds per year
 * @param frequency - The compounding frequency
 * @returns Number of times interest is compounded per year
 */
function getFrequencyNumber(frequency: string): number {
  switch (frequency) {
    case 'annually': return 1;
    case 'semi-annually': return 2;
    case 'quarterly': return 4;
    case 'monthly': return 12;
    case 'weekly': return 52;
    case 'daily': return 365;
    default: return 1;
  }
}
