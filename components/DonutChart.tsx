
import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

interface DonutChartProps {
  correctPercent: number;
  wrongPercent: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ correctPercent, wrongPercent }) => {
  const hasData = (correctPercent + wrongPercent) > 0;
  // Gráfico menor para o layout de resumo compacto
  const chartSize = 160;
  
  const data = hasData 
    ? [
        { name: 'Acertos', value: correctPercent, color: '#22c55e' },
        { name: 'Erros', value: wrongPercent, color: '#ef4444' }
      ]
    : [{ name: 'Vazio', value: 100, color: '#f3f4f6' }];

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <PieChart width={chartSize} height={chartSize}>
        <Pie
          data={data}
          cx={chartSize / 2}
          cy={chartSize / 2}
          innerRadius={50}
          outerRadius={70}
          paddingAngle={hasData ? 5 : 0}
          dataKey="value"
          startAngle={90}
          endAngle={450}
          stroke="none"
          isAnimationActive={true}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
      
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
