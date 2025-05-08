import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalculationParams, CalculationResult, calculateCompoundInterest, formatCurrency } from "@/utils/calculatorUtils";

interface ResultsDisplayProps {
  params: CalculationParams | null;
  solveFor?: 'principal' | 'rate' | 'time' | 'finalAmount';
}

function getFormulaForSolveFor(solveFor: string | undefined, frequency: string) {
  if (frequency === 'continuously') {
    switch (solveFor) {
      case 'principal': return 'P = A / e^(rt)';
      case 'finalAmount': return 'A = P × e^(rt)';
      case 'rate': return 'r = ln(A/P) / t';
      case 'time': return 't = ln(A/P) / r';
      default: return 'A = P × e^(rt)';
    }
  }
  switch (solveFor) {
    case 'principal': return 'P = A / (1 + r/n)^(nt)';
    case 'finalAmount': return 'A = P(1 + r/n)^(nt)';
    case 'rate': return 'r = n((A/P)^(1/nt) - 1)';
    case 'time': return 't = log(A/P) / (n × log(1 + r/n))';
    default: return 'A = P(1 + r/n)^(nt)';
  }
}

function getStepByStepCalculation(params: CalculationParams, solveFor: string | undefined) {
  const { principal, rate, time, frequency } = params;
  const rateDecimal = rate / 100;
  const n = frequency === 'continuously' ? Math.E : getFrequencyNumber(frequency);
  const finalAmount = params.targetAmount || calculateCompoundInterest(params).finalAmount;
  
  if (frequency === 'continuously') {
    switch (solveFor) {
      case 'principal':
        return [
          `P = A / e^(rt)`,
          `P = ${formatCurrency(finalAmount)} / e^(${rateDecimal.toFixed(4)} × ${time})`,
          `P = ${formatCurrency(finalAmount)} / ${Math.exp(rateDecimal * time).toFixed(4)}`,
          `P = ${formatCurrency(principal)}`
        ];
      case 'finalAmount':
        return [
          `A = P × e^(rt)`,
          `A = ${formatCurrency(principal)} × e^(${rateDecimal.toFixed(4)} × ${time})`,
          `A = ${formatCurrency(principal)} × ${Math.exp(rateDecimal * time).toFixed(4)}`,
          `A = ${formatCurrency(finalAmount)}`
        ];
      case 'rate':
        return [
          `r = ln(A/P) / t`,
          `r = ln(${formatCurrency(finalAmount)}/${formatCurrency(principal)}) / ${time}`,
          `r = ${Math.log(finalAmount/principal).toFixed(4)} / ${time}`,
          `r = ${(rateDecimal * 100).toFixed(2)}%`
        ];
      case 'time':
        return [
          `t = ln(A/P) / r`,
          `t = ln(${formatCurrency(finalAmount)}/${formatCurrency(principal)}) / ${rateDecimal.toFixed(4)}`,
          `t = ${Math.log(finalAmount/principal).toFixed(4)} / ${rateDecimal.toFixed(4)}`,
          `t = ${time} years`
        ];
      default:
        return [
          `A = P × e^(rt)`,
          `A = ${formatCurrency(principal)} × e^(${rateDecimal.toFixed(4)} × ${time})`,
          `A = ${formatCurrency(principal)} × ${Math.exp(rateDecimal * time).toFixed(4)}`,
          `A = ${formatCurrency(finalAmount)}`
        ];
    }
  } else {
    const nValue = Number(n);
    switch (solveFor) {
      case 'principal':
        return [
          `P = A / (1 + r/n)^(nt)`,
          `P = ${formatCurrency(finalAmount)} / (1 + ${rateDecimal.toFixed(4)}/${nValue})^(${nValue} × ${time})`,
          `P = ${formatCurrency(finalAmount)} / (${(1 + rateDecimal/nValue).toFixed(4)})^(${nValue * time})`,
          `P = ${formatCurrency(finalAmount)} / ${Math.pow(1 + rateDecimal/nValue, nValue * time).toFixed(4)}`,
          `P = ${formatCurrency(principal)}`
        ];
      case 'finalAmount':
        return [
          `A = P(1 + r/n)^(nt)`,
          `A = ${formatCurrency(principal)}(1 + ${rateDecimal.toFixed(4)}/${nValue})^(${nValue} × ${time})`,
          `A = ${formatCurrency(principal)}(${(1 + rateDecimal/nValue).toFixed(4)})^(${nValue * time})`,
          `A = ${formatCurrency(principal)} × ${Math.pow(1 + rateDecimal/nValue, nValue * time).toFixed(4)}`,
          `A = ${formatCurrency(finalAmount)}`
        ];
      case 'rate':
        return [
          `r = n((A/P)^(1/nt) - 1)`,
          `r = ${nValue}((${formatCurrency(finalAmount)}/${formatCurrency(principal)})^(1/(${nValue} × ${time})) - 1)`,
          `r = ${nValue}((${(finalAmount/principal).toFixed(4)})^(1/${nValue * time}) - 1)`,
          `r = ${nValue}(${Math.pow(finalAmount/principal, 1/(nValue * time)).toFixed(4)} - 1)`,
          `r = ${(rateDecimal * 100).toFixed(2)}%`
        ];
      case 'time':
        return [
          `t = log(A/P) / (n × log(1 + r/n))`,
          `t = log(${formatCurrency(finalAmount)}/${formatCurrency(principal)}) / (${nValue} × log(1 + ${rateDecimal.toFixed(4)}/${nValue}))`,
          `t = ${Math.log(finalAmount/principal).toFixed(4)} / (${nValue} × ${Math.log(1 + rateDecimal/nValue).toFixed(4)})`,
          `t = ${Math.log(finalAmount/principal).toFixed(4)} / ${(nValue * Math.log(1 + rateDecimal/nValue)).toFixed(4)}`,
          `t = ${time} years`
        ];
      default:
        return [
          `A = P(1 + r/n)^(nt)`,
          `A = ${formatCurrency(principal)}(1 + ${rateDecimal.toFixed(4)}/${nValue})^(${nValue} × ${time})`,
          `A = ${formatCurrency(principal)}(${(1 + rateDecimal/nValue).toFixed(4)})^(${nValue * time})`,
          `A = ${formatCurrency(principal)} × ${Math.pow(1 + rateDecimal/nValue, nValue * time).toFixed(4)}`,
          `A = ${formatCurrency(finalAmount)}`
        ];
    }
  }
}

export function ResultsDisplay({ params, solveFor }: ResultsDisplayProps) {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [displayParams, setDisplayParams] = useState<CalculationParams | null>(null);

  useEffect(() => {
    if (params) {
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
    }
  }, [params]);

  if (!result || !displayParams) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">Calculation Results</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="mb-4 w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:gap-1">
            <TabsTrigger value="summary" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-1.5">Summary</TabsTrigger>
            <TabsTrigger value="breakdown" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-1.5">Year by Year</TabsTrigger>
            <TabsTrigger value="formula" className="flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-1.5">Formula</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-muted-foreground">Principal Amount</h3>
                <p className="text-xl sm:text-2xl font-bold">{formatCurrency(displayParams.principal)}</p>
              </div>
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-muted-foreground">Final Amount</h3>
                <p className="text-xl sm:text-2xl font-bold">{formatCurrency(result.finalAmount)}</p>
              </div>
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-muted-foreground">Total Interest Earned</h3>
                <p className="text-xl sm:text-2xl font-bold">{formatCurrency(result.totalInterest)}</p>
              </div>
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-muted-foreground">Interest to Principal Ratio</h3>
                <p className="text-xl sm:text-2xl font-bold">
                  {(result.totalInterest / displayParams.principal * 100).toFixed(2)}%
                </p>
              </div>
            </div>
            {!isValid && (
              <div className="text-xs sm:text-sm text-muted-foreground mt-2">
                Showing sample calculation. Please fill in all required fields for your own result.
              </div>
            )}
          </TabsContent>
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
          <TabsContent value="formula" className="space-y-4">
            <div className="bg-muted p-4 sm:p-6 rounded-lg">
              <h3 className="text-base sm:text-lg font-medium mb-2">Formula Used:</h3>
              <p className="text-base sm:text-xl font-mono break-all">{getFormulaForSolveFor(solveFor, displayParams.frequency)}</p>
              <div className="mt-4 space-y-2 text-sm sm:text-base">
                <p><strong>Where:</strong></p>
                <p>A = Final amount ({formatCurrency(result.finalAmount)})</p>
                <p>P = Principal ({formatCurrency(displayParams.principal)})</p>
                <p>r = Annual interest rate ({displayParams.rate}%)</p>
                <p>t = Time period ({displayParams.time} years)</p>
                {displayParams.frequency !== 'continuously' && (
                  <p>n = Number of times compounded per year ({getFrequencyNumber(displayParams.frequency)})</p>
                )}
              </div>
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
