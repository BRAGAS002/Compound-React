
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
  
  // Calculate yearly breakdown
  const yearlyBreakdown: YearlyBreakdown[] = [];
  
  for (let year = 1; year <= time; year++) {
    let yearAmount: number;
    
    if (frequency === 'continuously') {
      yearAmount = principal * Math.exp((rate / 100) * year);
    } else {
      yearAmount = principal * Math.pow(1 + (rate / 100) / n, n * year);
    }
    
    const previousAmount = year === 1 ? principal : yearlyBreakdown[year - 2].amount;
    const interestEarned = yearAmount - previousAmount;
    
    let yearDate: string | undefined;
    if (startDate) {
      const date = new Date(startDate);
      date.setFullYear(date.getFullYear() + year);
      yearDate = date.toISOString().split('T')[0];
    }
    
    yearlyBreakdown.push({
      year,
      amount: yearAmount,
      interestEarned,
      date: yearDate
    });
  }
  
  return {
    finalAmount,
    totalInterest,
    yearlyBreakdown,
    formula
  };
};

// Generate unique ID for history items
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Store calculation in history
export const saveCalculation = (params: CalculationParams, result: CalculationResult): void => {
  const historyItem: CalculationHistory = {
    ...params,
    ...result,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  
  const history = getCalculationHistory();
  history.unshift(historyItem);
  
  localStorage.setItem('calculationHistory', JSON.stringify(history));
};

// Get calculation history from localStorage
export const getCalculationHistory = (): CalculationHistory[] => {
  const history = localStorage.getItem('calculationHistory');
  return history ? JSON.parse(history) : [];
};

// Delete a calculation from history
export const deleteCalculation = (id: string): void => {
  const history = getCalculationHistory();
  const updatedHistory = history.filter(item => item.id !== id);
  localStorage.setItem('calculationHistory', JSON.stringify(updatedHistory));
};

// Clear all calculation history
export const clearCalculationHistory = (): void => {
  localStorage.setItem('calculationHistory', JSON.stringify([]));
};
