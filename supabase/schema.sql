-- 1. ENUMS
CREATE TYPE faction_enum AS ENUM ('Rebelde', 'Imperio', 'Cazarrecompensas');
CREATE TYPE mission_status AS ENUM ('open', 'claimed', 'completed');

-- 2. TABLAS
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  credits INTEGER DEFAULT 1000,
  faction faction_enum DEFAULT 'Cazarrecompensas'
);

CREATE TABLE public.planets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  climate TEXT,
  terrain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.starships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT,
  hyperdrive_rating NUMERIC,
  cargo_capacity BIGINT,
  image_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.missions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  bounty_credits INTEGER NOT NULL,
  status mission_status DEFAULT 'open',
  target_planet_id UUID REFERENCES public.planets(id),
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRIGGER: Crear perfil al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role, credits, faction)
  VALUES (new.id, new.raw_user_meta_data->>'username', 'user', 1000, 'Cazarrecompensas');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. ROW LEVEL SECURITY (RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PROFILES
CREATE POLICY "Perfiles públicos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Modificar propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin control total profiles" ON public.profiles FOR ALL USING (is_admin());

-- POLÍTICAS PLANETS
CREATE POLICY "Planetas públicos" ON public.planets FOR SELECT USING (true);
CREATE POLICY "Admin control total planets" ON public.planets FOR ALL USING (is_admin());

-- POLÍTICAS STARSHIPS
CREATE POLICY "Naves públicas" ON public.starships FOR SELECT USING (true);
CREATE POLICY "Crear nave" ON public.starships FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Actualizar propia nave" ON public.starships FOR UPDATE USING (auth.uid() = created_by OR is_admin());
CREATE POLICY "Eliminar propia nave" ON public.starships FOR DELETE USING (auth.uid() = created_by OR is_admin());

-- POLÍTICAS MISSIONS
CREATE POLICY "Misiones públicas" ON public.missions FOR SELECT USING (true);
CREATE POLICY "Crear misión" ON public.missions FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Actualizar misión propia o asignada" ON public.missions FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to OR is_admin());
CREATE POLICY "Eliminar misión" ON public.missions FOR DELETE USING (auth.uid() = created_by OR is_admin());

-- 5. BUCKET STORAGE RLS (Asumiendo que el bucket 'holocron-assets' existe)
-- Las políticas de storage operan en storage.objects
CREATE POLICY "Lectura pública de assets" ON storage.objects FOR SELECT USING (bucket_id = 'holocron-assets');
CREATE POLICY "Subida de assets (solo a su propia carpeta)" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'holocron-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Actualización de assets (propia carpeta)" ON storage.objects FOR UPDATE USING (bucket_id = 'holocron-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Eliminación de assets (propia carpeta)" ON storage.objects FOR DELETE USING (bucket_id = 'holocron-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
