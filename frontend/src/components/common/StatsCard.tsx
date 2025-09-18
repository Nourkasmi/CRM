import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

interface StatsCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ icon, value, label, color }) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center">
          <Box sx={{ mr: 2, color: color || "primary.main" }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h6">{value}</Typography>
            <Typography color="textSecondary">{label}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
