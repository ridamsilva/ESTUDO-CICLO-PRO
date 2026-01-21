
import React from 'react';

interface DonutChartProps {
  correctPercent: number;
  wrongPercent: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ correctPercent, wrongPercent }) => {
  const size = 160;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const hasData = (correctPercent + wrongPercent) > 0;
  
  // Cálculo dos arcos
  const correctOffset = circumference - (correctPercent / 100) * circumference;
  const wrongOffset = circumference - (wrongPercent / 100) * circumference;
  const wrongRotate = (correctPercent / 100) * 360;

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Fundo Cinza */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        
        {hasData ? (
          <>
            {/* Erros (Red) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#ef4444"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={wrongOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              transform={`rotate(${wrongRotate} ${size/2} ${size/2})`}
            />
            {/* Acertos (Green) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#22c55e"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={correctOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </>
        ) : null}
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {hasData ? (
          <div className="text-center">
            <div className="text-2xl font-black text-green-600 leading-none">
              {correctPercent}%
            </div>
            <div className="text-sm font-black text-red-400 leading-none mt-1">
              {wrongPercent}%
            </div>
          </div>
        ) : (
          <span className="text-gray-300 text-[8px] font-black uppercase tracking-widest">Sem Dados</span>
        )}
      </div>
    </div>
  );
};

export default DonutChart;
