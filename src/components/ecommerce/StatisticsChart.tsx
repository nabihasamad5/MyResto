"use client";
import React from "react";
// import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";
import dynamic from "next/dynamic";

import { Order } from "@/types/global";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function StatisticsChart({ orders = [] }: { orders?: Order[] }) {
  // Process orders to get monthly data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthIndex = i; // 0 for Jan, 1 for Feb, etc.
    const monthOrders = orders.filter((order) => {
      const d = new Date(order.created_at);
      return d.getMonth() === monthIndex;
    });

    // Calculate sales (count of orders)
    // You might want to filter by status (e.g., only completed) if needed
    // For now, let's count all or maybe only valid ones
    const sales = monthOrders.length;

    // Calculate revenue (sum of total)
    // Assuming 'total' is the revenue amount
    const revenue = monthOrders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

    return { sales, revenue };
  });

  const series = [
    {
      name: "Sales",
      data: monthlyData.map((d) => d.sales),
    },
  ];

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["red"], // Define line colors
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "area", // ensure type matches used in render
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      width: [2],
    },

    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0.1,
      },
    },
    markers: {
      size: 4,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      x: {
        format: "dd MMM yyyy",
      },
      y: {
        formatter: function (y) {
          if (typeof y !== "undefined") {
            return y.toFixed(0) + " orders";
          }
          return y;
        },
      },
    },
    xaxis: {
      type: "category",
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      title: {
        text: "Orders",
        style: {
          color: "#6B7280",
        },
      },
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
          fontFamily: "Outfit, sans-serif",
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Restaurant Statistics
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Statistics for each month
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          {/* <ChartTab /> */}
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={310}
          />
        </div>
      </div>
    </div>
  );
}
