import { useState } from "react";
import { Layout } from "@/components/layout";
import { CalculatorForm } from "@/components/calculator-form";
import { ResultsDisplay } from "@/components/results-display";
import { CalculationHistory } from "@/components/calculation-history";
import { MissingValueCalculator } from "@/components/missing-value-calculator";
import { CalculationParams } from "@/utils/calculatorUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [calculationParams, setCalculationParams] = useState<CalculationParams | null>(null);
  const [solveFor, setSolveFor] = useState<'principal' | 'rate' | 'time' | 'finalAmount'>('principal');
  const [activeTab, setActiveTab] = useState('calculator');

  const handleCalculate = (params: CalculationParams, solveForValue?: 'principal' | 'rate' | 'time' | 'finalAmount') => {
    setCalculationParams(params);
    if (solveForValue) setSolveFor(solveForValue);
  };

  return (
    <Layout>
      <div className="w-full px-4">
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-black">Compound Interest Calculator</h2>
          <p className="text-center text-muted-foreground mb-8 text-black">
            Plan your financial future by calculating how your investments will grow over time with the power of compound interest.
          </p>
        </section>

        <Tabs
          value={activeTab}
          onValueChange={val => {
            setActiveTab(val);
            if (val === 'missing-value') setSolveFor('principal');
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="missing-value">Compute Missing Value</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-8">
            <CalculatorForm onCalculate={handleCalculate} />
            {calculationParams && <ResultsDisplay params={calculationParams} />}
          </TabsContent>
          
          <TabsContent value="missing-value" className="space-y-8">
            <MissingValueCalculator onCalculate={(params, solveForValue) => handleCalculate(params, solveForValue)} solveFor={solveFor} setSolveFor={setSolveFor} />
            {calculationParams && <ResultsDisplay params={calculationParams} solveFor={solveFor} />}
          </TabsContent>
          
          <TabsContent value="history">
            <CalculationHistory onSelectHistory={handleCalculate} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
