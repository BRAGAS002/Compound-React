
import { useState } from "react";
import { Layout } from "@/components/layout";
import { CalculatorForm } from "@/components/calculator-form";
import { ResultsDisplay } from "@/components/results-display";
import { CalculationHistory } from "@/components/calculation-history";
import { CalculationParams } from "@/utils/calculatorUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [calculationParams, setCalculationParams] = useState<CalculationParams | null>(null);

  const handleCalculate = (params: CalculationParams) => {
    setCalculationParams(params);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-center mb-8">Compound Interest Calculator</h2>
          <p className="text-center text-muted-foreground mb-8">
            Plan your financial future by calculating how your investments will grow over time with the power of compound interest.
          </p>
        </section>

        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-8">
            <CalculatorForm onCalculate={handleCalculate} />
            {calculationParams && <ResultsDisplay params={calculationParams} />}
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
