import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Map wage label to employment role hint
function mapRole(wageLabel) {
  const label = (wageLabel || '').toLowerCase();
  if (label.includes('district co-ordinator') || label.includes('district coordinator')) return 'district_coordinator';
  if (label.includes('thematic co-ordinator') || label.includes('thematic coordinator')) return 'thematic_coordinator';
  if (label.includes('field supervisor')) return 'field_supervisor';
  if (label.includes('m&e')) return 'me_administrator';
  return 'participant';
}

// Derive municipality from locality name
function mapMunicipality(locality) {
  const l = (locality || '').toLowerCase();
  if (l.includes('kwadukuza') || l.includes('dukuza')) return 'KwaDukuza';
  if (l.includes('mandeni')) return 'Mandeni';
  if (l.includes('ndwedwe') || l.includes('ndwendwe')) return 'Ndwedwe';
  if (l.includes('maphumulo') || l.includes('kwamaphumulo')) return 'Maphumulo';
  return 'KwaDukuza';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { participants } = await req.json();

    if (!Array.isArray(participants) || participants.length === 0) {
      return Response.json({ error: 'No participants provided' }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    const errors = [];

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < participants.length; i += batchSize) {
      const batch = participants.slice(i, i + batchSize);
      const records = batch.map(p => {
        const role = mapRole(p.currentWageLabel);
        const firstName = (p.firstname || '').trim();
        const surname = (p.surname || '').trim();
        const fullName = `${firstName} ${surname}`.trim();
        const locality = (p.currentLocalityName || '').trim();
        const municipality = mapMunicipality(locality);

        return {
          full_name: fullName,
          id_number: (p.idnumber || '').toString().trim(),
          user_email: `${(p.idnumber || '').toString().trim()}@participant.yms`,
          employment_start_date: p.contractStartDate || null,
          municipality,
          employment_status: 'active',
          notes: `Role: ${p.currentWageLabel || ''} | Site: ${p.currentSiteName || ''} | Locality: ${locality}`,
          // Store role info in district_coordinator_name if applicable
          ...(role === 'field_supervisor' || role === 'district_coordinator' || role === 'thematic_coordinator'
            ? { supervisor_name: fullName }
            : {}),
        };
      });

      try {
        await base44.asServiceRole.entities.FieldAgent.bulkCreate(records);
        created += records.length;
      } catch (err) {
        errors.push(`Batch ${i}-${i + batchSize}: ${err.message}`);
        skipped += records.length;
      }
    }

    return Response.json({ success: true, created, skipped, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});