"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Order } from "@/types/global";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function MonthlyRestaurantChart({ orders = [] }: { orders: Order[] }) {
  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const hasPropOrders = Array.isArray(orders) && orders.length > 0;
  useEffect(() => {
    let cancelled = false;
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && Array.isArray(json?.data)) {
          setLocalOrders(json.data);
        }
      } catch { }
    }
    if (!hasPropOrders) fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [hasPropOrders]);
  const dataOrders = hasPropOrders ? orders : localOrders;
  const options: ApexOptions = {
    colors: ["#e4002b"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 320,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "40%",
        borderRadius: 6,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
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
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px",
          fontFamily: "Outfit, sans-serif",
          fontWeight: 400,
        },
      }
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      markers: {
        // radius: 6, // radius is not a valid property in standard ApexOptions for markers
      },
    },
    yaxis: {
      title: {
        text: undefined,
      },
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px",
          fontFamily: "Outfit, sans-serif",
          fontWeight: 400,
        },
      },
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10,
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
      style: {
        fontSize: '12px',
        fontFamily: 'Outfit, sans-serif',
      },
      marker: {
        show: false,
      },
      theme: 'light',
    },
  };
  const series = [
    {
      name: "Orders",
      data: Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        return dataOrders.filter(o => {
          const createdAt = new Date(o.created_at);
          return createdAt.getMonth() + 1 === month;
        }).length;
      }),
    },
  ];
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Monthly Orders
        </h3>

        <div className="relative inline-block">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={320}
          />
        </div>
      </div>
    </div>
  );
}
