-- Insert sample categories
INSERT INTO categories (id, name, color, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'العمل', '#3b82f6', 0),
  ('22222222-2222-2222-2222-222222222222', 'شخصي', '#10b981', 1),
  ('33333333-3333-3333-3333-333333333333', 'أفكار', '#f59e0b', 2);

-- Insert sample notes
INSERT INTO notes (id, category_id, title, sort_order) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'مهام اليوم', 0),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'اجتماعات الأسبوع', 1),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'قائمة التسوق', 0),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'مشاريع مستقبلية', 0);

-- Insert sample points
INSERT INTO points (note_id, content, sort_order) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'مراجعة التقارير الشهرية', 0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'الرد على الرسائل الإلكترونية', 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'تحديث الوثائق', 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'اجتماع فريق التطوير - الأحد', 0),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'عرض المشروع - الثلاثاء', 1),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'حليب وخبز', 0),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'خضروات طازجة', 1),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'تعلم لغة برمجة جديدة', 0),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'بناء تطبيق للملاحظات', 1);
