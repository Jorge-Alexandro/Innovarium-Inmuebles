-- SCHEMA DE BASE DE DATOS PARA INOVARIUM INMUEBLES (SUPABASE / POSTGRESQL)
-- MVP: Gestión de Mantenimiento Preventivo de Condominios en México
-- Diseñado e implementado por Kenzly junto a Emmanuel y Adrián para Inovarium Tech

-- 1. Tabla de Condominios
CREATE TABLE condominio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    m2 NUMERIC(10,2) NOT NULL DEFAULT 20.00, -- Condominio de escala representativa
    direccion VARCHAR(250) NOT NULL,
    regimen VARCHAR(100) NOT NULL DEFAULT 'Régimen de Propiedad en Condominio'
);

-- 2. Tabla de Áreas
CREATE TABLE area (
    id VARCHAR(50) PRIMARY KEY, -- Usamos IDs legibles como 'gas', 'luz', 'agua' para facilidad en el MVP
    condominio_id UUID REFERENCES condominio(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    estado_salud VARCHAR(20) NOT NULL CHECK (estado_salud IN ('al_dia', 'por_vencer', 'vencido')) DEFAULT 'al_dia'
);

-- 3. Tabla de Activos del Condominio
CREATE TABLE activo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id VARCHAR(50) REFERENCES area(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    marca VARCHAR(100),
    fecha_instalacion DATE DEFAULT CURRENT_DATE
);

-- 4. Tabla de Responsables (Administrador, Proveedor, Líder de Mantenimiento)
CREATE TABLE responsable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id UUID REFERENCES condominio(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'proveedor', 'lider')),
    email VARCHAR(150) NOT NULL UNIQUE
);

-- 5. Tabla de Tareas Preventivas Coincidentes con la Estructura Obligatoria
CREATE TABLE tarea_preventiva (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id VARCHAR(50) REFERENCES area(id) ON DELETE CASCADE,
    activo_id UUID REFERENCES activo(id) ON DELETE SET NULL,
    titulo VARCHAR(150) NOT NULL,
    instrucciones_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- Checklist secuencial de pasos
    frecuencia VARCHAR(20) NOT NULL CHECK (frecuencia IN ('diaria', 'semanal', 'mensual', 'trimestral', 'semestral', 'anual')),
    proxima_fecha DATE NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('programada', 'en_curso', 'completada', 'vencida')) DEFAULT 'programada',
    costo_estimado NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    costo_real NUMERIC(12,2),
    admin_id UUID REFERENCES responsable(id) ON DELETE SET NULL,
    proveedor_id UUID REFERENCES responsable(id) ON DELETE SET NULL,
    lider_id UUID REFERENCES responsable(id) ON DELETE SET NULL
);

-- 6. Tabla de Evidencias (Prueba de Realización)
CREATE TABLE evidencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarea_id UUID REFERENCES tarea_preventiva(id) ON DELETE CASCADE,
    archivo_url VARCHAR(255) NOT NULL,
    nota TEXT,
    creada_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    creada_por UUID REFERENCES responsable(id) ON DELETE SET NULL
);

-- 7. Tabla de Presupuestos
CREATE TABLE presupuesto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id UUID REFERENCES condominio(id) ON DELETE CASCADE,
    area_id VARCHAR(50) REFERENCES area(id) ON DELETE CASCADE,
    anio INT NOT NULL,
    monto_presupuestado NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    monto_gastado NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT unique_presupuesto_area UNIQUE (condominio_id, area_id, anio)
);

-- 8. Tabla de Eventos de Trazabilidad
CREATE TABLE evento_trazabilidad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarea_id UUID REFERENCES tarea_preventiva(id) ON DELETE CASCADE,
    accion VARCHAR(255) NOT NULL,
    actor VARCHAR(150) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);


-- ===========================================================================
-- SEED DATA - UN CONDOMINIO PILOTO DE RELEVANCIA CON 10 ÁREAS Y 15 TAREAS
-- ===========================================================================

-- Insertar Condominio Piloto (~20 departamentos / unidades operacionales)
INSERT INTO condominio (id, nombre, m2, direccion, regimen)
VALUES (
    'a3b8cd9e-1234-5678-abcd-ef1234567890', 
    'Condominio Las Vertientes', 
    20.00, 
    'Av. de los Pirules 440, Lomas de Tecamachalco, Huixquilucan, EdoMéx', 
    'Régimen de Propiedad en Condominio Residencial'
);

-- Insertar las 10 Áreas Requeridas
INSERT INTO area (id, condominio_id, nombre, estado_salud) VALUES 
('gas', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'Gas', 'al_dia'),
('luz', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'Luz / Electricidad', 'por_vencer'),
('agua', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'Agua', 'al_dia'),
('electro', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'Electrodomésticos', 'al_dia'),
('llaves', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'Llaves / Cerrajería', 'por_vencer'),
('banos', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'Baños', 'al_dia'),
('cocina', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'Cocina', 'vencido'),
('seguridad', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'Sistemas de Seguridad', 'al_dia'),
('incendios', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'Sistemas Contra Incendios', 'vencido'),
('amenidades', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'Amenidades', 'al_dia');

-- Insertar Activos Principales para las Áreas
INSERT INTO activo (id, area_id, nombre, marca, fecha_instalacion) VALUES 
('b1111111-e111-a222-3333-444444444444', 'gas', 'Tanque Estacionario de Gas 1000L', 'Tratogas', '2022-04-10'),
('b2222222-e111-a222-3333-444444444444', 'luz', 'Subestación Eléctrica Principal 150KVA', 'Siemens', '2021-08-15'),
('b3333333-e111-a222-3333-444444444444', 'agua', 'Bomba Hidroneumática 5HP Altamira', 'Altamira', '2023-01-20'),
('b4444444-e111-a222-3333-444444444444', 'electro', 'Refrigerador Industrial de Casa Club', 'Samsung', '2023-05-12'),
('b5555555-e111-a222-3333-444444444444', 'llaves', 'Chapas Electromagnéticas de Accesos Peatonales', 'Yale', '2023-11-02'),
('b6666666-e111-a222-3333-444444444444', 'banos', 'Extractor de Humedad Baño Gimnasio', 'S&P', '2022-09-18'),
('b7777777-e111-a222-3333-444444444444', 'cocina', 'Campana de Extracción y Trampa de Grasa Sótano', 'Inox', '2021-12-05'),
('b8888888-e111-a222-3333-444444444444', 'seguridad', 'Grabador NVR 16 Canales Hikvision', 'Hikvision', '2022-05-20'),
('b9999999-e111-a222-3333-444444444444', 'incendios', 'Central Metálica de Extintores PQS 9Kg', 'Buckeye', '2021-11-10'),
('b0000000-e111-a222-3333-444444444444', 'amenidades', 'Sistema de Calentamiento Solar Alberca', 'Helio', '2023-02-14');

-- Insertar Responsables Operativos del Condominio
INSERT INTO responsable (id, condominio_id, nombre, rol, email) VALUES 
('c1111111-d111-4444-5555-666666666666', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'Laura Méndez', 'admin', 'admin@lasvertientes.mx'),
('c2222222-d111-4444-5555-666666666666', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'Karl Ruiz (Hotelería+)', 'proveedor', 'soporte@hoteleriamas.mx'),
('c3333333-d111-4444-5555-666666666666', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'Carlos Ruiz', 'lider', 'carlos.lider@servicio.mx'),
('c4444444-d111-4444-5555-666666666666', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'GasSeguro del Valle S.A.', 'proveedor', 'ordenes@gasseguro.mx'),
('c5555555-d111-4444-5555-666666666666', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'ElectroPro Eléctricos', 'proveedor', 'asistencia@electropro.mx'),
('c6666666-d111-4444-5555-666666666666', 'a3b8cd9e-1234-5678-abcd-ef1234567890', 'AlarmaTotal de México', 'proveedor', 'ops@alarmatotal.mx');

-- Insertar Presupuesto Anual (Año 2026) por Área
INSERT INTO presupuesto (condominio_id, area_id, anio, monto_presupuestado, monto_gastado) VALUES 
('a3b8cd9e-1234-5678-abcd-ef1234567890', 'gas', 2026, 14000.00, 11200.00),
('a3b8cd9e-1234-5678-abcd-ef1234567890', 'luz', 2026, 22000.00, 18400.00),
('a3b8cd9e-1234-5678-abcd-ef1234567890', 'agua', 2026, 18000.00, 16100.00),
('a3b8cd9e-1234-5678-abcd-ef1234567890', 'electro', 2026, 8000.00, 5200.00),
('a3b8cd9e-1234-5678-abcd-ef1234567890', 'llaves', 2026, 6000.00, 4800.00),
('a3b8cd9e-1234-5678-abcd-ef1234567890', 'banos', 2026, 9000.00, 8650.00),
('a3b8cd9e-1234-5678-abcd-ef1234567890', 'cocina', 2026, 11000.00, 12300.00), -- Alerta de sobregiro
('a3b8cd9e-1234-5678-abcd-ef1234567890', 'seguridad', 2026, 16000.00, 13900.00),
('a3b8cd9e-1234-5678-abcd-ef1234567890', 'incendios', 2026, 13000.00, 6400.00),
('a3b8cd9e-1234-5678-abcd-ef1234567890', 'amenidades', 2026, 19000.00, 17500.00);

-- Insertar Tareas Preventivas (Mínimo de 15 Tareas distribuidas estratégicamente)
INSERT INTO tarea_preventiva (id, area_id, activo_id, titulo, instrucciones_json, frecuencia, proxima_fecha, estado, costo_estimado, costo_real, admin_id, proveedor_id, lider_id) VALUES 
-- Gas (Al día)
('d1111111-2222-3333-4444-555555555551', 'gas', 'b1111111-e111-a222-3333-444444444444', 
 'Prueba de hermeticidad y detección de fugas', 
 '["Verificar presión en manómetros", "Revisar válvulas reguladoras", "Prueba jabonosa en uniones de tuberías", "Firmar bitácora de dictamen técnico COFEPRIS"]', 
 'trimestral', '2026-07-03', 'programada', 1800.00, 1750.00, 
 'c1111111-d111-4444-5555-666666666666', 'c4444444-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Gas (Por vencer)
('d1111111-2222-3333-4444-555555555552', 'gas', 'b1111111-e111-a222-3333-444444444444', 
 'Calibración de sensores de gas en cocina común', 
 '["Utilizar gas patrón de prueba", "Ajustar umbral de disparo de alarma sonora", "Probar el corte automático por electroválvula"]', 
 'semestral', '2026-06-30', 'en_curso', 1300.00, NULL, 
 'c1111111-d111-4444-5555-666666666666', 'c4444444-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Luz (Por Vencer)
('d1111111-2222-3333-4444-555555555553', 'luz', 'b2222222-e111-a222-3333-444444444444', 
 'Revisión y termografía de cargas de tablero general', 
 '["Inspección visual del devanado de la subestación", "Escaneo termográfico de interruptores termomagnéticos", "Ajuste de torque en conexiones"]', 
 'semestral', '2026-06-28', 'en_curso', 2600.00, NULL, 
 'c1111111-d111-4444-5555-666666666666', 'c5555555-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Luz (Vencido)
('d1111111-2222-3333-4444-555555555554', 'luz', NULL, 
 'Pruebas de arranque y fluidos de planta de emergencia', 
 '["Simular corte de suministro residencial", "Medir tiempo de transferencia (<10 seg)", "Comprobar niveles de diésel, refrigerante y aceite", "Soplar filtro de aire"]', 
 'mensual', '2026-06-18', 'vencida', 800.00, NULL, 
 'c1111111-d111-4444-5555-666666666666', 'c5555555-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Agua (Al día)
('d1111111-2222-3333-4444-555555555555', 'agua', NULL, 
 'Lavado profundo de cisterna y desinfección química', 
 '["Drenar remanente de agua de cisterna", "Cepillar muros interiores con hipoclorito de sodio", "Enjuagar y bombear lodos residuales", "Llenar y verificar parámetros de dureza"]', 
 'semestral', '2026-08-15', 'programada', 3200.00, 3100.00, 
 'c1111111-d111-4444-5555-666666666666', 'c2222222-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Agua (Al día)
('d1111111-2222-3333-4444-555555555556', 'agua', 'b3333333-e111-a222-3333-444444444444', 
 'Inspección de bombas hidroneumáticas de presión', 
 '["Revisar rangos de arranque/paro en presostato", "Medir amperaje de consumo en motores", "Lubricar rodamientos sellados", "Purgar aire de tanques de membrana"]', 
 'trimestral', '2026-07-10', 'programada', 1500.00, 1500.00, 
 'c1111111-d111-4444-5555-666666666666', 'c2222222-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Electrodomésticos (Al día)
('d1111111-2222-3333-4444-555555555557', 'electro', 'b4444444-e111-a222-3333-444444444444', 
 'Limpieza de condensador de refrigeradores de casa club', 
 '["Retirar rejilla de protección trasera", "Soplar y aspirar pelusa del serpentín condensador", "Verificar correcto cierre de gomas magnéticas de puertas"]', 
 'anual', '2026-09-01', 'programada', 900.00, NULL, 
 'c1111111-d111-4444-5555-666666666666', 'c5555555-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Llaves/Cerrajería (Por Vencer)
('d1111111-2222-3333-4444-555555555558', 'llaves', 'b5555555-e111-a222-3333-444444444444', 
 'Mantenimiento preventivo y lubricación de chapas magnéticas', 
 '["Alinear placas de atracción magnética", "Aplicar spray limpiador dieléctrico en contactos", "Verificar retardo de apertura del timer en recepción"]', 
 'mensual', '2026-06-26', 'en_curso', 400.00, NULL, 
 'c1111111-d111-4444-5555-666666666666', 'c2222222-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Baños (Al día)
('d1111111-2222-3333-4444-555555555559', 'banos', 'b6666666-e111-a222-3333-444444444444', 
 'Sanitización profunda y desobstrucción de ductos', 
 '["Limpiar extractor del baño de vapor", "Revisar válvulas fluxómetrico y cambiar empaques", "Aplicar desincrustante ácido en coladeras"]', 
 'mensual', '2026-07-05', 'programada', 700.00, 680.00, 
 'c1111111-d111-4444-5555-666666666666', 'c2222222-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Cocina (Vencido)
('d1111111-2222-3333-4444-555555555560', 'cocina', 'b7777777-e111-a222-3333-444444444444', 
 'Desengrase de campana industrial y desazolve de trampa', 
 '["Retirar trampas de grasa desmontables", "Lavar filtros con desengrasante alcalino a presión", "Remover costra de grasa en ducto vertical", "Suministrar bacteria digestora de grasa"]', 
 'mensual', '2026-06-12', 'vencida', 1100.00, NULL, 
 'c1111111-d111-4444-5555-666666666666', 'c2222222-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Seguridad (Al día)
('d1111111-2222-3333-4444-555555555561', 'seguridad', 'b8888888-e111-a222-3333-444444444444', 
 'Prueba de cámaras y depuración de almacenamiento', 
 '["Comprobar enfoque de 12 cámaras", "Limpiar domos de cristal perimetrales", "Asegurar respaldo histórico de 30 días de grabación", "Soplar ventiladores del NVR"]', 
 'mensual', '2026-07-08', 'programada', 1200.00, 1200.00, 
 'c1111111-d111-4444-5555-666666666666', 'c6666666-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Incendios (Vencido)
('d1111111-2222-3333-4444-555555555562', 'incendios', 'b9999999-e111-a222-3333-444444444444', 
 'Recarga y pesaje anual de extintores PQS', 
 '["Verificar presión en rango verde en manómetro", "Inspeccionar manguera y boquillas de descarga", "Reemplazar póliza física con fecha de vigencia 2027", "Recargar el agente químico seco"]', 
 'anual', '2026-06-05', 'vencida', 2400.00, NULL, 
 'c1111111-d111-4444-5555-666666666666', 'c6666666-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Incendios (Al día)
('d1111111-2222-3333-4444-555555555563', 'incendios', NULL, 
 'Prueba funcional de sensores de humo y estación manual', 
 '["Activar sensor de humo por aerosol de prueba", "Verificar transmisión de señal sonora a cabina principal", "Prueba de baterías de respaldo del panel contra incendios"]', 
 'semestral', '2026-07-20', 'programada', 1600.00, NULL, 
 'c1111111-d111-4444-5555-666666666666', 'c6666666-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Amenidades (Al día)
('d1111111-2222-3333-4444-555555555564', 'amenidades', 'b0000000-e111-a222-3333-444444444444', 
 'Monitoreo de filtrado y calefacción solar de la alberca', 
 '["Análisis físico-químico del agua (cloro libre y pH)", "Retrolavado de filtros de arena de cuarzo", "Inspeccionar válvulas de alivio en paneles hidrotérmicos"]', 
 'mensual', '2026-07-02', 'programada', 1900.00, 1900.00, 
 'c1111111-d111-4444-5555-666666666666', 'c2222222-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666'),

-- Amenidades (Al día)
('d1111111-2222-3333-4444-555555555565', 'amenidades', NULL, 
 'Servicio y sellado de madera en asadores y pérgola', 
 '["Limpieza abrasiva metálica en parrillas", "Revisar herrajes y bisagras contra intemperie", "Aplicar impregnante protector de madera poro abierto"]', 
 'trimestral', '2026-08-09', 'programada', 600.00, NULL, 
 'c1111111-d111-4444-5555-666666666666', 'c2222222-d111-4444-5555-666666666666', 'c3333333-d111-4444-5555-666666666666');

-- 9. Insertar Evidencias Reales Existentes en Tareas de Estatus Satisfecho
INSERT INTO evidencia (tarea_id, archivo_url, nota, creada_por) VALUES 
('d1111111-2222-3333-4444-555555555551', 'https://static.lasvertientes.mx/evidences/gas-h01.jpg', 'Dictamen técnico emitido con sello aprobatorio.', 'c3333333-d111-4444-5555-666666666666'),
('d1111111-2222-3333-4444-555555555555', 'https://static.lasvertientes.mx/evidences/agua-cis03.jpg', 'Limpieza concluida, niveles de cloro restablecidos a 1.5 ppm.', 'c2222222-d111-4444-5555-666666666666'),
('d1111111-2222-3333-4444-555555555556', 'https://static.lasvertientes.mx/evidences/agua-bomp05.jpg', 'Ruidos extraños eliminados por lubricación y calibración de diafragma.', 'c3333333-d111-4444-5555-666666666666'),
('d1111111-2222-3333-4444-555555555559', 'https://static.lasvertientes.mx/evidences/ban-ext.jpg', 'Extractores de baño funcionando correctamente.', 'c2222222-d111-4444-5555-666666666666'),
('d1111111-2222-3333-4444-555555555561', 'https://static.lasvertientes.mx/evidences/seg-nvr.jpg', 'Se respaldaron videos de la asamblea previa. NVR limpio.', 'c6666666-d111-4444-5555-666666666666'),
('d1111111-2222-3333-4444-555555555564', 'https://static.lasvertientes.mx/evidences/pool-filter.jpg', 'Retrolavado exitoso. Agua en óptimo estado.', 'c3333333-d111-4444-5555-666666666666');

-- 10. Insertar Eventos Iniciales de Trazabilidad
INSERT INTO evento_trazabilidad (tarea_id, accion, actor, fecha) VALUES 
('d1111111-2222-3333-4444-555555555551', 'Tarea asignada automáticamente por cronograma trimestral', 'Sistema', '2026-06-01 10:00:00-06'),
('d1111111-2222-3333-4444-555555555551', 'Confirmación de visita programada aprobada en asamblea', 'Laura Méndez', '2026-06-03 14:15:00-06'),
('d1111111-2222-3333-4444-555555555551', 'Mantenimiento del tanque residencial completado con éxito', 'GasSeguro del Valle S.A.', '2026-06-15 11:30:00-06'),
('d1111111-2222-3333-4444-555555555551', 'Aprobación del informe de evidencias y cierre contable', 'Carlos Ruiz', '2026-06-16 09:00:00-06');
