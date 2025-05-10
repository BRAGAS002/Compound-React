import { supabase } from "@/integrations/supabase/client";

/**
 * Types and Interfaces
 */

// Define possible compounding frequencies
export type CompoundingFrequency = 
  | 'annually' 
  | 'semi-annually' 
  | 'quarterly' 
  | 'monthly' 
  | 'weekly' 
  | 'daily';

// Parameters required for compound interest calculation
export interface CalculationParams {
  principal: number;      // Initial investment amount
  rate: number;          // Annual interest rate (as percentage)
  time: number;          // Time period
  timeUnit: 'years' | 'days';  // Unit of time (years or days)
  frequency: CompoundingFrequency;  // How often interest is compounded
  startDate?: Date | null;  // Optional start date for the calculation
  targetAmount?: number;    // Optional target amount for reverse calculations
}

// Yearly breakdown of the investment growth
export interface YearlyBreakdown {
  year: number;          // Year number or period number
  amount: number;        // Total amount at this period
  interestEarned: number; // Interest earned in this period
  date?: string;         // Optional date for this period
}

// Result of a compound interest calculation
export interface CalculationResult {
  finalAmount: number;   // Final amount after compounding
  totalInterest: number; // Total interest earned
  yearlyBreakdown: YearlyBreakdown[]; // Detailed breakdown by period
  formula: string;       // Formula used for calculation
}

// Extended calculation parameters for history storage
export interface CalculationHistory extends Omit<CalculationParams, 'targetAmount'> {
  id: string;            // Unique identifier
  createdAt: string;     // Timestamp of calculation
  finalAmount: number;   // Final amount calculated
  totalInterest: number; // Total interest earned
  formula: string;       // Formula used
}

/**
 * Utility Functions
 */

// Convert frequency string to number of compounds per year
export const getFrequencyValue = (frequency: CompoundingFrequency): number => {
  switch (frequency) {
    case 'annually': return 1;
    case 'semi-annually': return 2;
    case 'quarterly': return 4;
    case 'monthly': return 12;
    case 'weekly': return 52;
    case 'daily': return 365;
    default: return 1;
  }
};

// Format number as Philippine Peso currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Format number as percentage
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};

// Get the appropriate formula string based on compounding frequency
export const getFormula = (frequency: CompoundingFrequency, solveFor?: string): string => {
  switch (solveFor) {
    case 'time':
      return 't = ln(A/P) / (n × ln(1 + r/n))';
    default:
      return 'CI = P(1 + r/n)^(nt) - P';
  }
};

/**
 * Main Calculation Functions
 */

// Calculate compound interest with detailed breakdown
export const calculateCompoundInterest = (params: CalculationParams): CalculationResult => {
  const { principal, rate, time, timeUnit, frequency, startDate } = params;
  const n = getFrequencyValue(frequency);
  
  // Convert time to years if it's in days
  const timeInYears = timeUnit === 'days' ? time / 365 : time;
  
  // Calculate final amount using formula
  const finalAmount = principal * Math.pow(1 + (rate / 100) / n, n * timeInYears);
  const totalInterest = finalAmount - principal;
  const formula = getFormula(frequency);
  
  // Generate detailed breakdown for each period
  const breakdown: YearlyBreakdown[] = [];
  const totalPeriods = n * timeInYears;
  let currentDate = startDate ? new Date(startDate) : undefined;
  let previousAmount = principal;

  // Calculate values for each period
  for (let i = 1; i <= totalPeriods; i++) {
    let periodAmount: number;
    let period = i;
    let periodTime = i / n;
    
    // Calculate amount for this period
    periodAmount = principal * Math.pow(1 + (rate / 100) / n, n * periodTime);
    const interestEarned = periodAmount - previousAmount;
    previousAmount = periodAmount;

    // Calculate date for this period if start date is provided
    let periodDate: string | undefined;
    if (currentDate) {
      let date = new Date(currentDate);
      switch (frequency) {
        case 'annually':
          date.setFullYear(date.getFullYear() + 1);
          break;
        case 'semi-annually':
          date.setMonth(date.getMonth() + 6);
          break;
        case 'quarterly':
          date.setMonth(date.getMonth() + 3);
          break;
        case 'monthly':
          date.setMonth(date.getMonth() + 1);
          break;
        case 'weekly':
          date.setDate(date.getDate() + 7);
          break;
        case 'daily':
          date.setDate(date.getDate() + 1);
          break;
      }
      periodDate = date.toISOString().split('T')[0];
      currentDate = date;
    }

    breakdown.push({
      year: period,
      amount: periodAmount,
      interestEarned,
      date: periodDate
    });
  }

  return {
    finalAmount,
    totalInterest,
    yearlyBreakdown: breakdown,
    formula
  };
};

// Generate unique ID for history items
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Store calculation in history
export const saveCalculation = async (params: CalculationParams, result: CalculationResult): Promise<void> => {
  const historyItem: CalculationHistory = {
    ...params,
    ...result,
    id: generateId(),
    createdAt: new Date().toISOString(),
    finalAmount: result.finalAmount,
    totalInterest: result.totalInterest,
    formula: result.formula
  };
  
  // Save to localStorage
  const history = await getCalculationHistory();
  history.unshift(historyItem);
  localStorage.setItem('calculationHistory', JSON.stringify(history));
  
  // Save to Supabase database
  try {
    const { data, error } = await supabase.from('calculations').insert([{
      principal: params.principal,
      rate: params.rate,
      time: params.time,
      time_unit: params.timeUnit,
      frequency: params.frequency,
      start_date: params.startDate?.toISOString() ?? null,
      final_amount: result.finalAmount,
      total_interest: result.totalInterest,
      formula: result.formula,
      created_at: historyItem.createdAt
    }]);
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    console.log('Successfully saved to Supabase:', data);
  } catch (error) {
    console.error('Failed to save calculation to database:', error);
  }
};

// Get calculation history from both localStorage and database
export const getCalculationHistory = async (): Promise<CalculationHistory[]> => {
  // Get from localStorage
  const localHistory = localStorage.getItem('calculationHistory');
  const localHistoryItems = localHistory ? JSON.parse(localHistory) : [];
  
  try {
    // Get from database
    const { data: dbHistory, error } = await supabase
      .from('calculations')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Supabase fetch error:', error);
      throw error;
    }
    
    // Merge and deduplicate history items
    const dbHistoryItems = dbHistory.map(item => ({
      id: item.id,
      principal: item.principal,
      rate: item.rate,
      time: item.time,
      time_unit: item.time_unit,
      frequency: item.frequency,
      startDate: item.start_date ? new Date(item.start_date) : null,
      finalAmount: item.final_amount,
      totalInterest: item.total_interest,
      formula: item.formula,
      createdAt: item.created_at
    }));
    
    // Combine both histories, removing duplicates based on createdAt
    const combinedHistory = [...localHistoryItems];
    dbHistoryItems.forEach(dbItem => {
      if (!combinedHistory.some(localItem => localItem.createdAt === dbItem.createdAt)) {
        combinedHistory.push(dbItem);
      }
    });
    
    return combinedHistory;
  } catch (error) {
    console.error('Failed to fetch calculations from database:', error);
    return localHistoryItems;
  }
};

// Delete a calculation from both localStorage and database
export const deleteCalculation = async (id: string): Promise<void> => {
  // Delete from localStorage
  const history = await getCalculationHistory();
  const updatedHistory = history.filter(item => item.id !== id);
  localStorage.setItem('calculationHistory', JSON.stringify(updatedHistory));
  
  // Delete from database
  try {
    const { error } = await supabase
      .from('calculations')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete calculation from database:', error);
  }
};

// Clear all calculation history from both localStorage and database
export const clearCalculationHistory = async (): Promise<void> => {
  // Clear localStorage
  localStorage.setItem('calculationHistory', JSON.stringify([]));
  
  // Clear database
  try {
    await supabase.from('calculations').delete().neq('id', '');
  } catch (error) {
    console.error('Failed to clear calculations from database:', error);
  }
};

// Calculate missing principal amount
export const calculateMissingPrincipal = (
  finalAmount: number,
  rate: number,
  time: number,
  frequency: CompoundingFrequency,
  timeUnit: 'years' | 'days' = 'years'
): number => {
  const n = getFrequencyValue(frequency);
  const timeInYears = timeUnit === 'days' ? time / 365 : time;
  return finalAmount / Math.pow(1 + (rate / 100) / n, n * timeInYears);
};

// Calculate missing final amount
export const calculateMissingFinalAmount = (
  principal: number,
  rate: number,
  time: number,
  frequency: CompoundingFrequency,
  timeUnit: 'years' | 'days' = 'years'
): number => {
  const n = getFrequencyValue(frequency);
  const timeInYears = timeUnit === 'days' ? time / 365 : time;
  return principal * Math.pow(1 + (rate / 100) / n, n * timeInYears);
};

// Calculate missing interest rate
export const calculateMissingRate = (
  principal: number,
  finalAmount: number,
  time: number,
  frequency: CompoundingFrequency,
  timeUnit: 'years' | 'days' = 'years'
): number => {
  const n = getFrequencyValue(frequency);
  const timeInYears = timeUnit === 'days' ? time / 365 : time;
  return (Math.pow(finalAmount / principal, 1 / (n * timeInYears)) - 1) * n * 100;
};

// Calculate missing time period
export const calculateMissingTime = (
  principal: number,
  finalAmount: number,
  rate: number,
  frequency: CompoundingFrequency,
  timeUnit: 'years' | 'days' = 'years'
): number => {
  const n = getFrequencyValue(frequency);
  const timeInYears = Math.log(finalAmount / principal) / (n * Math.log(1 + (rate / 100) / n));
  return timeUnit === 'days' ? timeInYears * 365 : timeInYears;
};
