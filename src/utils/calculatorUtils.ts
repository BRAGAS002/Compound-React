import { supabase } from "@/integrations/supabase/client";

export type CompoundingFrequency = 
  | 'annually' 
  | 'semi-annually' 
  | 'quarterly' 
  | 'monthly' 
  | 'weekly' 
  | 'daily' 
  | 'continuously';

export interface CalculationParams {
  principal: number;
  rate: number;
  time: number;
  frequency: CompoundingFrequency;
  startDate?: Date | null;
}

export interface YearlyBreakdown {
  year: number;
  amount: number;
  interestEarned: number;
  date?: string;
}

export interface CalculationResult {
  finalAmount: number;
  totalInterest: number;
  yearlyBreakdown: YearlyBreakdown[];
  formula: string;
}

export interface CalculationHistory extends CalculationParams, CalculationResult {
  id: string;
  createdAt: string;
}

// Get frequency value as number of compounds per year
export const getFrequencyValue = (frequency: CompoundingFrequency): number => {
  switch (frequency) {
    case 'annually': return 1;
    case 'semi-annually': return 2;
    case 'quarterly': return 4;
    case 'monthly': return 12;
    case 'weekly': return 52;
    case 'daily': return 365;
    case 'continuously': return Infinity;
    default: return 1;
  }
};

// Format numbers as currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Format percentage values
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};

// Generate the formula based on compounding frequency
export const getFormula = (frequency: CompoundingFrequency): string => {
  if (frequency === 'continuously') {
    return 'A = P × e^(rt)';
  }
  return 'A = P(1 + r/n)^(nt)';
};

// Calculate compound interest
export const calculateCompoundInterest = (params: CalculationParams): CalculationResult => {
  const { principal, rate, time, frequency, startDate } = params;
  const n = getFrequencyValue(frequency);
  let finalAmount: number;
  
  // Calculate final amount based on frequency
  if (frequency === 'continuously') {
    finalAmount = principal * Math.exp((rate / 100) * time);
  } else {
    finalAmount = principal * Math.pow(1 + (rate / 100) / n, n * time);
  }
  
  const totalInterest = finalAmount - principal;
  const formula = getFormula(frequency);
  
  // Calculate breakdown for each compounding period
  const breakdown: YearlyBreakdown[] = [];
  const totalPeriods = frequency === 'continuously' ? time : n * time;
  let currentDate = startDate ? new Date(startDate) : undefined;
  let previousAmount = principal;

  for (let i = 1; i <= totalPeriods; i++) {
    let periodAmount: number;
    let period = i;
    let periodTime = frequency === 'continuously' ? i : i / n;
    if (frequency === 'continuously') {
      periodAmount = principal * Math.exp((rate / 100) * periodTime);
    } else {
      periodAmount = principal * Math.pow(1 + (rate / 100) / n, n * periodTime);
    }
    const interestEarned = periodAmount - previousAmount;
    previousAmount = periodAmount;

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
        default:
          break;
      }
      periodDate = date.toISOString().split('T')[0];
      currentDate = date;
    }

    breakdown.push({
      year: period, // keep property name for compatibility with UI, but it's now payment number
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
    createdAt: new Date().toISOString()
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
      frequency: params.frequency,
      startDate: params.startDate?.toISOString() ?? null,
      finalAmount: result.finalAmount,
      totalInterest: result.totalInterest,
      formula: result.formula,
      created_at: historyItem.createdAt
    }]);
    console.log('Supabase insert result:', { data, error });
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
    console.log('Supabase fetch result:', { dbHistory, error });
    if (error) throw error;
    
    // Merge and deduplicate history items
    const dbHistoryItems = dbHistory.map(item => ({
      ...item,
      id: item.id || generateId(),
      startDate: item.startDate ? new Date(item.startDate) : null
    }));
    console.log('dbHistoryItems:', dbHistoryItems);
    
    // Combine both histories, removing duplicates based on createdAt
    const combinedHistory = [...localHistoryItems];
    dbHistoryItems.forEach(dbItem => {
      if (!combinedHistory.some(localItem => localItem.createdAt === dbItem.created_at)) {
        combinedHistory.push({
          ...dbItem,
          createdAt: dbItem.created_at
        });
      }
    });
    console.log('Combined history:', combinedHistory);
    
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
    await supabase.from('calculations').delete().eq('id', id);
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
  frequency: CompoundingFrequency
): number => {
  const n = getFrequencyValue(frequency);
  return finalAmount / Math.pow(1 + (rate / 100) / n, n * time);
};

// Calculate missing final amount
export const calculateMissingFinalAmount = (
  principal: number,
  rate: number,
  time: number,
  frequency: CompoundingFrequency
): number => {
  const n = getFrequencyValue(frequency);
  return principal * Math.pow(1 + (rate / 100) / n, n * time);
};

// Calculate missing interest rate
export const calculateMissingRate = (
  principal: number,
  finalAmount: number,
  time: number,
  frequency: CompoundingFrequency
): number => {
  const n = getFrequencyValue(frequency);
  return n * (Math.pow(finalAmount / principal, 1 / (n * time)) - 1) * 100;
};

// Calculate missing time period
export const calculateMissingTime = (
  principal: number,
  finalAmount: number,
  rate: number,
  frequency: CompoundingFrequency
): number => {
  const n = getFrequencyValue(frequency);
  return Math.log(finalAmount / principal) / (n * Math.log(1 + (rate / 100) / n));
};
