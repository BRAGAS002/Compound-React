import { useState } from "react";
import { Layout } from "@/components/layout";
import { CalculatorForm } from "@/components/calculator-form";
import { ResultsDisplay } from "@/components/results-display";
import { CalculationHistory } from "@/components/calculation-history";
import { MissingValueCalculator } from "@/components/missing-value-calculator";
import { CalculationParams } from "@/utils/calculatorUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Index Component - Main Page of the Compound Interest Calculator
 * 
 * This component manages the main calculator interface with three main features:
 * 1. Standard Calculator: Calculate compound interest with all parameters
 * 2. Missing Value Calculator: Solve for a specific missing parameter
 * 3. Calculation History: View and reuse past calculations
 */
const Index = () => {
  // State management for calculator parameters and active tab
  const [calculationParams, setCalculationParams] = useState<CalculationParams | null>(null);
  const [solveFor, setSolveFor] = useState<'principal' | 'rate' | 'time' | 'finalAmount'>('principal');
  const [activeTab, setActiveTab] = useState('calculator');

  /**
   * Handles calculation results from both standard and missing value calculators
   * @param params - The calculation parameters
   * @param solveForValue - Optional parameter indicating which value to solve for
   */
  const handleCalculate = (params: CalculationParams, solveForValue?: 'principal' | 'rate' | 'time' | 'finalAmount') => {
    setCalculationParams(params);
    if (solveForValue) setSolveFor(solveForValue);
  };

  return (
    <Layout>
      <div className="w-full px-4">
        {/* Header Section */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-black">Compound Interest Calculator</h2>
          <p className="text-center text-muted-foreground mb-8 text-black">
            Plan your financial future by calculating how your investments will grow over time with the power of compound interest.
          </p>
        </section>

        {/* Main Calculator Interface with Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={val => {
            setActiveTab(val);
            if (val === 'missing-value') setSolveFor('principal');
          }}
          className="w-full"
        >
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-1 mb-8">
            <TabsTrigger value="calculator" className="text-xs sm:text-sm py-2 sm:py-1.5">Calculator</TabsTrigger>
            <TabsTrigger value="missing-value" className="text-xs sm:text-sm py-2 sm:py-1.5">Compute Missing Value</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm py-2 sm:py-1.5">History</TabsTrigger>
          </TabsList>
          
          {/* Standard Calculator Tab */}
          <TabsContent value="calculator" className="space-y-8">
            <CalculatorForm onCalculate={handleCalculate} />
            {calculationParams && <ResultsDisplay params={calculationParams} />}
          </TabsContent>
          
          {/* Missing Value Calculator Tab */}
          <TabsContent value="missing-value" className="space-y-8">
            <MissingValueCalculator 
              onCalculate={(params, solveForValue) => handleCalculate(params, solveForValue)} 
              solveFor={solveFor} 
              setSolveFor={setSolveFor} 
            />
            {calculationParams && <ResultsDisplay params={calculationParams} solveFor={solveFor} />}
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history">
            <CalculationHistory onSelectHistory={handleCalculate} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
