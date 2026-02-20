import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from 'lucide-react';

export default function AdminShopManagement({ shops = [] }) {
  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Store className="w-5 h-5 text-cyan-400" />
          Shop Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-400 text-sm">{shops.length} shops registered.</p>
      </CardContent>
    </Card>
  );
}