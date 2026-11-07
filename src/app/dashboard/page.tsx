import {
  CalendarDays,
  ShoppingBag,
  UsersRound,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Appointments",
      value: "248",
      description: "+12.5% from last month",
      icon: CalendarDays,
    },
    {
      title: "Total Orders",
      value: "156",
      description: "+8.2% from last month",
      icon: ShoppingBag,
    },
    {
      title: "Total Customers",
      value: "1,240",
      description: "+18.4% from last month",
      icon: UsersRound,
    },
    {
      title: "Revenue",
      value: "Rs. 245,000",
      description: "+10.3% from last month",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Dashboard
        </h1>

        <p className="text-sm text-muted-foreground">
          Welcome back! Here's what's happening at Leo Saloon.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">

                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>

                <Icon className="size-5 text-muted-foreground" />

              </div>

              <div className="mt-3">
                <h2 className="text-2xl font-bold">
                  {stat.value}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}

      </div>

      <div className="grid gap-4 lg:grid-cols-2">

        <div className="min-h-72 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">
            Recent Appointments
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Your recent appointments will appear here.
          </p>
        </div>

        <div className="min-h-72 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">
            Recent Orders
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Your recent orders will appear here.
          </p>
        </div>

      </div>

    </div>
  );
}