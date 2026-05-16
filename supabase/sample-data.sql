-- Sample data for KrishiNetra dashboard testing.
-- Run after schema.sql. Safe to re-run -- uses unique claim_id values.

insert into public.claims (
  claim_id, farmer_id, farmer_name, mobile_number,
  village, taluka, district, crop_type, farm_area, survey_number,
  gps_latitude, gps_longitude, gps_accuracy,
  gps_trust_status, location_risk,
  photo_url, photo_source, submission_date,
  claim_status, risk_score,
  ai_predicted_crop, ai_confidence, ndvi_value, sync_status
) values
-- 1. Valid GPS sugarcane claim
(
  'CLAIM-SAMPLE-001', 'FARMER-SAMPLE-001', 'Ramesh Patil', '9876543210',
  'Malegaon', 'Baramati', 'Pune', 'Sugarcane', 4, '42/2',
  18.1517, 74.5777, 12,
  'Valid', 'GPS location appears reliable.',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80',
  'Live Camera', '2026-05-14T10:30:00Z',
  'Pending', 0.18,
  'Sugarcane', 0.92, 0.64, 'Mobile App'
),
-- 2. Spoofing suspected cotton claim
(
  'CLAIM-SAMPLE-002', 'FARMER-SAMPLE-002', 'Sunita Jadhav', '9876543211',
  'Niphad', 'Niphad', 'Nashik', 'Cotton', 2.8, '88/1',
  20.4234, 73.9123, 9,
  'Spoofing Suspected', 'GPS metadata suggests mock-location app was active.',
  'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=900&q=80',
  'Gallery Upload', '2026-05-13T14:05:00Z',
  'Flagged', 0.82,
  'Soybean', 0.71, 0.36, 'Mobile App'
),
-- 3. High risk low NDVI onion claim
(
  'CLAIM-SAMPLE-003', 'FARMER-SAMPLE-003', 'Mahadev Shinde', '9876543212',
  'Sinnar', 'Sinnar', 'Nashik', 'Onion', 1.7, '101/4',
  19.8458, 73.9986, 28,
  'Suspicious', 'GPS accuracy is poor (>20m). Field officer should verify.',
  'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=900&q=80',
  'Live Camera', '2026-05-12T09:15:00Z',
  'High Risk', 0.74,
  'Onion', 0.65, 0.18, 'Mobile App'
);

insert into public.farmers (
  farmer_id, farmer_name, mobile_number, aadhaar_or_farmer_id,
  village, taluka, district, state
) values
(
  'FARMER-SAMPLE-001', 'Ramesh Patil', '9876543210', 'XXXX-XXXX-0001',
  'Malegaon', 'Baramati', 'Pune', 'Maharashtra'
),
(
  'FARMER-SAMPLE-002', 'Sunita Jadhav', '9876543211', 'XXXX-XXXX-0002',
  'Niphad', 'Niphad', 'Nashik', 'Maharashtra'
);

insert into public.disaster_alerts (
  title, body, disaster_type, severity, district, taluka, crop_type, action_required
) values (
  'Heavy rain advisory',
  'Heavy rainfall expected in next 48 hours. Drain excess water from fields.',
  'Heavy Rain', 'High', 'Pune', 'Baramati', 'Sugarcane',
  'Inspect drainage channels; postpone fertiliser application.'
);

insert into public.admin_chat (
  farmer_id, farmer_name, mobile_number, issue_type, message, sender, status
) values (
  'FARMER-SAMPLE-001', 'Ramesh Patil', '9876543210',
  'GPS Issue', 'GPS accuracy is poor in my village. Please advise.',
  'farmer', 'Open'
);
