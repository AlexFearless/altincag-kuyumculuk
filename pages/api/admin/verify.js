import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Token gerekli' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, email, name, role, is_active')
      .eq('id', decoded.id)
      .single();

    if (!admin) {
      return res.status(401).json({ success: false, error: 'Admin bulunamadı' });
    }

    if (!admin.is_active) {
      return res.status(403).json({ success: false, error: 'Hesabınız devre dışı' });
    }

    res.status(200).json({ success: true, admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch {
    res.status(401).json({ success: false, error: 'Geçersiz token' });
  }
}
