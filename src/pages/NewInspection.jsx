import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Building,
  Droplets,
  Thermometer,
  Bug,
  Trash2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Camera,
  Loader2,
  AlertTriangle,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChecklistItem = ({ 
  label, 
  description, 
  value, 
  onChange, 
  photoValue, 
  onPhotoChange,
  criticalIfFail 
}) => {
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onPhotoChange(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      value === 'pass' ? 'bg-emerald-500/10 border-emerald-500/30' :
      value === 'fail' ? 'bg-red-500/10 border-red-500/30' :
      value === 'na' ? 'bg-slate-500/10 border-slate-500/30' :
      'bg-slate-800/50 border-slate-700/50'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium">{label}</p>
            {criticalIfFail && value === 'fail' && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">CRITICAL</span>
            )}
          </div>
          {description && (
            <p className="text-slate-400 text-sm mt-1">{description}</p>
          )}
        </div>
      </div>

      {/* Pass/Fail/NA Buttons */}
      <div className="flex gap-2 mt-4">
        <Button
          type="button"
          variant={value === 'pass' ? 'default' : 'outline'}
          onClick={() => onChange('pass')}
          className={`flex-1 h-14 gap-2 ${
            value === 'pass' 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0' 
              : 'border-slate-600 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          Pass
        </Button>
        <Button
          type="button"
          variant={value === 'fail' ? 'default' : 'outline'}
          onClick={() => onChange('fail')}
          className={`flex-1 h-14 gap-2 ${
            value === 'fail' 
              ? 'bg-red-600 hover:bg-red-700 text-white border-0' 
              : 'border-slate-600 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <XCircle className="w-5 h-5" />
          Fail
        </Button>
        <Button
          type="button"
          variant={value === 'na' ? 'default' : 'outline'}
          onClick={() => onChange('na')}
          className={`flex-1 h-14 gap-2 ${
            value === 'na' 
              ? 'bg-slate-600 hover:bg-slate-700 text-white border-0' 
              : 'border-slate-600 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <MinusCircle className="w-5 h-5" />
          N/A
        </Button>
      </div>

      {/* Photo Upload for Failed Items */}
      {value === 'fail' && onPhotoChange && (
        <div className="mt-4">
          <Label className="text-white text-sm">Evidence Photo (Required for Failed Items)</Label>
          <div className="mt-2">
            {photoValue ? (
              <div className="relative h-32 rounded-lg overflow-hidden">
                <img src={photoValue} alt="Evidence" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => onPhotoChange('')}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-red-500/50 bg-red-500/10 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2 text-red-400">
                    <Camera className="w-5 h-5" />
                    <span className="text-sm">Capture Evidence</span>
                  </div>
                )}
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ScoreMeter = ({ score }) => {
  const getColor = () => {
    if (score >= 80) return 'from-emerald-500 to-emerald-600';
    if (score >= 60) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  const getTextColor = () => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="text-center p-6 bg-slate-800/50 rounded-xl">
      <div className="relative w-40 h-40 mx-auto mb-4">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="14"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="url(#scoreGradient)"
            strokeWidth="14"
            fill="none"
            strokeDasharray={`${(score / 100) * 440} 440`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="scoreGradient">
              <stop offset="0%" stopColor={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'} />
              <stop offset="100%" stopColor={score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626'} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-bold ${getTextColor()}`}>{score}</span>
          <span className="text-slate-400 text-sm">Score</span>
        </div>
      </div>
      <p className={`text-lg font-semibold ${getTextColor()}`}>
        {score >= 80 ? 'Funding Eligible' : score >= 60 ? 'Needs Improvement' : 'Non-Compliant'}
      </p>
      <p className="text-slate-400 text-sm">
        {score >= 80 ? 'This shop meets NEF requirements' : 'Address the failed items to improve score'}
      </p>
    </div>
  );
};

export default function NewInspection() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const shopId = urlParams.get('shop_id');
  
  const [currentSection, setCurrentSection] = useState(0);
  const [gpsLoading, setGpsLoading] = useState(false);

  const { data: shop } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: async () => {
      const shops = await base44.entities.Shop.filter({ id: shopId });
      return shops[0];
    },
    enabled: !!shopId
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const [formData, setFormData] = useState({
    shop_id: shopId,
    inspection_type: 'routine',
    inspector_email: '',
    inspector_name: '',
    gps_latitude: null,
    gps_longitude: null,
    check_in_time: new Date().toISOString(),
    
    // Structural
    structural_walls_floors: '',
    structural_walls_floors_photo: '',
    structural_ventilation: '',
    structural_pest_control: '',
    structural_pest_control_photo: '',
    
    // Hygiene
    hygiene_handwashing: '',
    hygiene_handwashing_photo: '',
    hygiene_soap_towels: '',
    hygiene_protective_clothing: '',
    hygiene_protective_clothing_photo: '',
    
    // Cold Chain
    coldchain_fridge_temp: '',
    coldchain_fridge_temp_photo: '',
    coldchain_separation: '',
    coldchain_separation_photo: '',
    
    // Inventory
    inventory_expired_count: 0,
    inventory_expired_photo: '',
    
    // Other
    waste_disposal: '',
    water_supply: '',
    chemical_storage: '',
    
    status: 'completed',
    corrective_actions: [],
    risk_flags: []
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        inspector_email: user.email,
        inspector_name: user.full_name
      }));
    }
  }, [user]);

  const sections = [
    {
      id: 'structural',
      title: 'Structural Hygiene',
      icon: Building,
      color: 'text-cyan-400'
    },
    {
      id: 'hygiene',
      title: 'Food Handling',
      icon: Droplets,
      color: 'text-emerald-400'
    },
    {
      id: 'coldchain',
      title: 'Cold Chain',
      icon: Thermometer,
      color: 'text-blue-400'
    },
    {
      id: 'inventory',
      title: 'Inventory & Waste',
      icon: Package,
      color: 'text-amber-400'
    }
  ];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateScore = () => {
    const checks = [
      { value: formData.structural_walls_floors, weight: 10, critical: false },
      { value: formData.structural_ventilation, weight: 10, critical: false },
      { value: formData.structural_pest_control, weight: 15, critical: true },
      { value: formData.hygiene_handwashing, weight: 20, critical: true },
      { value: formData.hygiene_soap_towels, weight: 10, critical: false },
      { value: formData.hygiene_protective_clothing, weight: 10, critical: false },
      { value: formData.coldchain_separation, weight: 15, critical: true },
      { value: formData.waste_disposal, weight: 5, critical: false },
      { value: formData.chemical_storage, weight: 5, critical: false }
    ];

    let totalWeight = 0;
    let earnedPoints = 0;

    checks.forEach(check => {
      if (check.value && check.value !== 'na') {
        totalWeight += check.weight;
        if (check.value === 'pass') {
          earnedPoints += check.weight;
        }
      }
    });

    // Fridge temp penalty
    const fridgeTemp = parseFloat(formData.coldchain_fridge_temp);
    if (!isNaN(fridgeTemp)) {
      if (fridgeTemp > 5) {
        earnedPoints = Math.max(0, earnedPoints - 20);
      }
    }

    // Expired items penalty
    if (formData.inventory_expired_count > 0) {
      earnedPoints = Math.max(0, earnedPoints - (formData.inventory_expired_count * 5));
    }

    return totalWeight > 0 ? Math.round((earnedPoints / totalWeight) * 100) : 0;
  };

  const captureGPS = () => {
    setGpsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gps_latitude: position.coords.latitude,
            gps_longitude: position.coords.longitude
          }));
          setGpsLoading(false);
        },
        (error) => {
          console.error('GPS error:', error);
          setGpsLoading(false);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const createInspection = useMutation({
    mutationFn: async (data) => {
      const inspection = await base44.entities.Inspection.create(data);
      
      // Update shop compliance status
      const score = calculateScore();
      const complianceStatus = score >= 80 ? 'compliant' : score >= 60 ? 'partially_compliant' : 'non_compliant';
      const fundingStatus = score >= 80 ? 'eligible' : 'not_eligible';
      
      await base44.entities.Shop.update(shopId, {
        compliance_score: score,
        compliance_status: complianceStatus,
        funding_status: fundingStatus,
        last_inspection_date: new Date().toISOString(),
        risk_level: score >= 80 ? 'low' : score >= 60 ? 'medium' : score >= 40 ? 'high' : 'critical'
      });
      
      return inspection;
    },
    onSuccess: () => {
      navigate(createPageUrl(`ShopDetail?id=${shopId}`));
    }
  });

  const handleSubmit = () => {
    const score = calculateScore();
    const riskFlags = [];
    
    if (formData.structural_pest_control === 'fail') riskFlags.push('Pest infestation detected');
    if (formData.hygiene_handwashing === 'fail') riskFlags.push('No handwashing facility');
    if (parseFloat(formData.coldchain_fridge_temp) > 5) riskFlags.push('Fridge temperature above 5°C');
    if (formData.inventory_expired_count > 0) riskFlags.push(`${formData.inventory_expired_count} expired items found`);

    const inspectionData = {
      ...formData,
      total_score: score,
      risk_flags: riskFlags,
      check_out_time: new Date().toISOString()
    };

    createInspection.mutate(inspectionData);
  };

  const progress = ((currentSection + 1) / sections.length) * 100;
  const score = calculateScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl(`ShopDetail?id=${shopId}`)}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Health Inspection</h1>
            <p className="text-slate-400 text-sm">{shop?.shop_name}</p>
          </div>
        </div>
        <Progress value={progress} className="h-2 bg-slate-700" />
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant={currentSection === i ? 'default' : 'outline'}
              onClick={() => setCurrentSection(i)}
              className={`flex-shrink-0 gap-2 ${
                currentSection === i 
                  ? 'bg-slate-700 text-white' 
                  : 'border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${section.color}`} />
              <span className="hidden md:inline">{section.title}</span>
            </Button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Checklist */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white flex items-center gap-2">
                {React.createElement(sections[currentSection].icon, { 
                  className: `w-5 h-5 ${sections[currentSection].color}` 
                })}
                {sections[currentSection].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Structural Section */}
                  {currentSection === 0 && (
                    <>
                      <ChecklistItem
                        label="Walls & Floors Smooth and Washable"
                        description="Surfaces must be easy to clean and maintain"
                        value={formData.structural_walls_floors}
                        onChange={(v) => updateField('structural_walls_floors', v)}
                        photoValue={formData.structural_walls_floors_photo}
                        onPhotoChange={(v) => updateField('structural_walls_floors_photo', v)}
                      />
                      <ChecklistItem
                        label="Adequate Ventilation"
                        description="Natural or mechanical ventilation present"
                        value={formData.structural_ventilation}
                        onChange={(v) => updateField('structural_ventilation', v)}
                      />
                      <ChecklistItem
                        label="Pest Control Measures"
                        description="No evidence of rodents, insects, or infestation"
                        value={formData.structural_pest_control}
                        onChange={(v) => updateField('structural_pest_control', v)}
                        photoValue={formData.structural_pest_control_photo}
                        onPhotoChange={(v) => updateField('structural_pest_control_photo', v)}
                        criticalIfFail
                      />
                    </>
                  )}

                  {/* Hygiene Section */}
                  {currentSection === 1 && (
                    <>
                      <ChecklistItem
                        label="Hand Washing Station Present"
                        description="Basin with running water available"
                        value={formData.hygiene_handwashing}
                        onChange={(v) => updateField('hygiene_handwashing', v)}
                        photoValue={formData.hygiene_handwashing_photo}
                        onPhotoChange={(v) => updateField('hygiene_handwashing_photo', v)}
                        criticalIfFail
                      />
                      <ChecklistItem
                        label="Soap and Towels Available"
                        description="Handwashing supplies present and accessible"
                        value={formData.hygiene_soap_towels}
                        onChange={(v) => updateField('hygiene_soap_towels', v)}
                      />
                      <ChecklistItem
                        label="Protective Clothing (PPE)"
                        description="Food handler wearing clean apron/hairnet"
                        value={formData.hygiene_protective_clothing}
                        onChange={(v) => updateField('hygiene_protective_clothing', v)}
                        photoValue={formData.hygiene_protective_clothing_photo}
                        onPhotoChange={(v) => updateField('hygiene_protective_clothing_photo', v)}
                      />
                    </>
                  )}

                  {/* Cold Chain Section */}
                  {currentSection === 2 && (
                    <>
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <Label className="text-white font-medium">Fridge Temperature Reading (°C)</Label>
                        <p className="text-slate-400 text-sm mb-3">Use thermometer to check internal temperature</p>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.coldchain_fridge_temp}
                          onChange={(e) => updateField('coldchain_fridge_temp', e.target.value)}
                          placeholder="e.g. 4.5"
                          className={`bg-slate-700 border-slate-600 text-white h-14 text-2xl text-center font-mono ${
                            parseFloat(formData.coldchain_fridge_temp) > 5 ? 'border-red-500 text-red-400' : ''
                          }`}
                        />
                        {parseFloat(formData.coldchain_fridge_temp) > 5 && (
                          <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400 font-medium">CRITICAL: Temperature exceeds 5°C safe limit!</span>
                          </div>
                        )}
                      </div>

                      <ChecklistItem
                        label="Raw/Cooked Food Separation"
                        description="Raw meat stored separately from ready-to-eat food"
                        value={formData.coldchain_separation}
                        onChange={(v) => updateField('coldchain_separation', v)}
                        photoValue={formData.coldchain_separation_photo}
                        onPhotoChange={(v) => updateField('coldchain_separation_photo', v)}
                        criticalIfFail
                      />
                    </>
                  )}

                  {/* Inventory Section */}
                  {currentSection === 3 && (
                    <>
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <Label className="text-white font-medium">Expired Items Found (Sample of 5)</Label>
                        <p className="text-slate-400 text-sm mb-3">Check 5 random items for expiry dates</p>
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateField('inventory_expired_count', Math.max(0, formData.inventory_expired_count - 1))}
                            className="h-14 w-14 border-slate-600 text-white"
                          >
                            -
                          </Button>
                          <div className={`flex-1 h-14 flex items-center justify-center text-3xl font-bold rounded-lg ${
                            formData.inventory_expired_count > 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-white'
                          }`}>
                            {formData.inventory_expired_count}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateField('inventory_expired_count', Math.min(5, formData.inventory_expired_count + 1))}
                            className="h-14 w-14 border-slate-600 text-white"
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <ChecklistItem
                        label="Waste Disposal Bins Present"
                        description="Proper waste management facilities"
                        value={formData.waste_disposal}
                        onChange={(v) => updateField('waste_disposal', v)}
                      />

                      <ChecklistItem
                        label="Chemical Storage Separate from Food"
                        description="Cleaning agents/paraffin stored away from food items"
                        value={formData.chemical_storage}
                        onChange={(v) => updateField('chemical_storage', v)}
                      />

                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <Label className="text-white font-medium">Water Supply</Label>
                        <RadioGroup
                          value={formData.water_supply}
                          onValueChange={(v) => updateField('water_supply', v)}
                          className="mt-3 flex gap-4"
                        >
                          {['tap', 'tank', 'none'].map(option => (
                            <div key={option} className="flex items-center gap-2">
                              <RadioGroupItem value={option} id={option} className="border-slate-500" />
                              <Label htmlFor={option} className="text-slate-300 capitalize">{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setCurrentSection(prev => prev - 1)}
                  disabled={currentSection === 0}
                  className="border-slate-600 text-white hover:bg-slate-700 gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>

                {currentSection < sections.length - 1 ? (
                  <Button
                    onClick={() => setCurrentSection(prev => prev + 1)}
                    className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white gap-2"
                  >
                    Next Section
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={createInspection.isPending}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white gap-2 min-w-40"
                  >
                    {createInspection.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Complete Inspection
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Score Panel */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 sticky top-4">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white">Live Compliance Score</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScoreMeter score={score} />
              
              {/* Risk Flags */}
              {(formData.structural_pest_control === 'fail' || 
                formData.hygiene_handwashing === 'fail' ||
                parseFloat(formData.coldchain_fridge_temp) > 5 ||
                formData.inventory_expired_count > 0) && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-semibold">Risk Flags</span>
                  </div>
                  <ul className="space-y-2 text-sm text-red-300">
                    {formData.structural_pest_control === 'fail' && <li>• Pest infestation detected</li>}
                    {formData.hygiene_handwashing === 'fail' && <li>• No handwashing facility</li>}
                    {parseFloat(formData.coldchain_fridge_temp) > 5 && <li>• Fridge temp above 5°C</li>}
                    {formData.inventory_expired_count > 0 && <li>• {formData.inventory_expired_count} expired items</li>}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          Powered by <span className="text-cyan-400 font-semibold">Kelestone Capital</span>
        </p>
      </div>
    </div>
  );
}