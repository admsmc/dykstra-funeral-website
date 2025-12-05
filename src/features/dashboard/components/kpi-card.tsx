/**
 * KPI Card Component
 * Displays a single KPI metric with optional link and trend
 */

"use client";

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cardVariants } from '@dykstra/ui';

export interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function KPICard({ title, value, icon, href, trend }: KPICardProps) {
  const content = (
    <motion.div
      initial="idle"
      whileHover="hover"
      variants={cardVariants}
      className="bg-white dark:bg-[--card] rounded-lg border border-gray-200 dark:border-[--border] p-6 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-[--muted-foreground] font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-[--foreground] mt-2">{value}</p>
          {trend && (
            <p
              className={`text-sm mt-2 ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp className="inline w-4 h-4 mr-1" />
              {trend.isPositive ? '+' : ''}
              {trend.value}% from last month
            </p>
          )}
        </div>
        <div className="p-3 bg-[--navy] rounded-lg text-white">{icon}</div>
      </div>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
