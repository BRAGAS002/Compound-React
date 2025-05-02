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

export function ResultsDisplay({ params, solveFor }: ResultsDisplayProps) {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const sampleParams: CalculationParams = {
    principal: 1000,
    rate: 5,
    time: 2,
    frequency: 'monthly',
  };
  const isValid = params &&
    typeof params.principal === 'number' && !isNaN(params.principal) && params.principal >= 0 &&
    typeof params.rate === 'number' && !isNaN(params.rate) && params.rate >= 0 &&
    typeof params.time === 'number' && !isNaN(params.time) && params.time >= 0 &&
    typeof params.frequency === 'string' && params.frequency;

  useEffect(() => {
    if (isValid) {
      const calculatedResult = calculateCompoundInterest(params!);
      setResult(calculatedResult);
    } else {
      const calculatedResult = calculateCompoundInterest(sampleParams);
      setResult(calculatedResult);
    }
  }, [params]);

  if (!result) {
    return null;
  }

  // Use params if valid, otherwise use sampleParams
  const displayParams = isValid ? params! : sampleParams;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Calculation Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="breakdown">Year by Year</TabsTrigger>
            <TabsTrigger value="formula">Formula</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-medium text-muted-foreground">Principal Amount</h3>
                <p className="text-2xl font-bold">{formatCurrency(displayParams.principal)}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-medium text-muted-foreground">Final Amount</h3>
                <p className="text-2xl font-bold">{formatCurrency(result.finalAmount)}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-medium text-muted-foreground">Total Interest Earned</h3>
                <p className="text-2xl font-bold">{formatCurrency(result.totalInterest)}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-medium text-muted-foreground">Interest to Principal Ratio</h3>
                <p className="text-2xl font-bold">
                  {(result.totalInterest / displayParams.principal * 100).toFixed(2)}%
                </p>
              </div>
            </div>
            {!isValid && (
              <div className="text-sm text-muted-foreground mt-2">
                Showing sample calculation. Please fill in all required fields for your own result.
              </div>
            )}
          </TabsContent>
          <TabsContent value="breakdown">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Number</TableHead>
                    {displayParams.startDate && <TableHead>Date</TableHead>}
                    <TableHead>Balance</TableHead>
                    <TableHead>Interest Earned</TableHead>
                    <TableHead>Total Interest</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.yearlyBreakdown.map((row) => {
                    const totalInterestToDate = displayParams.principal - displayParams.principal + row.amount - displayParams.principal;
                    return (
                      <TableRow key={row.year}>
                        <TableCell>{row.year}</TableCell>
                        {displayParams.startDate && <TableCell>{row.date}</TableCell>}
                        <TableCell>{formatCurrency(row.amount)}</TableCell>
                        <TableCell>{formatCurrency(row.interestEarned)}</TableCell>
                        <TableCell>{formatCurrency(totalInterestToDate)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="formula" className="space-y-4">
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Formula Used:</h3>
              <p className="text-xl font-mono">{getFormulaForSolveFor(solveFor, displayParams.frequency)}</p>
              <div className="mt-4 space-y-2">
                <p><strong>Where:</strong></p>
                <p>A = Final amount</p>
                <p>P = Principal ({formatCurrency(displayParams.principal)})</p>
                <p>r = Annual interest rate ({displayParams.rate}%)</p>
                <p>t = Time period ({displayParams.time} years)</p>
                {displayParams.frequency !== 'continuously' && (
                  <p>n = Number of times compounded per year</p>
                )}
              </div>
              <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-md">
                <h4 className="font-medium mb-2">Calculation:</h4>
                {displayParams.frequency === 'continuously' ? (
                  <p className="font-mono">
                    A = {formatCurrency(displayParams.principal)} × e^({(displayParams.rate / 100).toFixed(4)} × {displayParams.time}) = {formatCurrency(result.finalAmount)}
                  </p>
                ) : (
                  <p className="font-mono">
                    A = {formatCurrency(displayParams.principal)}(1 + {(displayParams.rate / 100).toFixed(4)}/{getFrequencyNumber(displayParams.frequency)})^({getFrequencyNumber(displayParams.frequency)} × {displayParams.time}) = {formatCurrency(result.finalAmount)}
                  </p>
                )}
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
