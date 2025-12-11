// data/catalog.js

export const mockCatalog = [
    { 
        id: 'prod-001', 
        nombre: 'Válvula Reguladora de Presión', 
        precio: 9.99, 
        stock: 50,
        descripcionCompleta: 'Válvula de reemplazo de alta durabilidad para sistemas hidráulicos. Fabricada en aleación de cobre y zinc (latón) con sellos de nitrilo. Soporta hasta 150 PSI. Es esencial revisar las dimensiones (50mm x 30mm) antes de la instalación. Compatible con modelos serie XJ 2018-2022.',
        imagenes: [
            'assets/images/prod-001-1.png',
            'assets/images/prod-001-2.png',
            'assets/images/prod-001-3.png',
            'assets/images/prod-001-4.png'
        ]
    },
    { 
        id: 'prod-002', 
        nombre: 'Sensor de Temperatura GMX', 
        precio: 15.50, 
        stock: 20,
        descripcionCompleta: 'Sensor termistor de respuesta rápida NTC 10k. Rango de operación de -40°C a 125°C. Conector de 3 pines, compatible con la línea de motores GMX. Utilizado para monitorización de refrigerante. Incluye arandela de sellado de alta temperatura.',
        imagenes: [
            'assets/images/prod-002-1.png',
            'assets/images/prod-002-2.png',
            'assets/images/prod-002-3.png'
        ]
    },
    { 
        id: 'prod-003', 
        nombre: 'Filtro de Aire Turbo (Unidad)', 
        precio: 199.00, 
        stock: 10,
        descripcionCompleta: 'Filtro de aire de alto flujo para sistemas turboalimentados. Material de nanofibra lavable y reutilizable. Mejora la eficiencia del motor. Diámetro de entrada: 80mm. Se recomienda lubricar ligeramente antes de la instalación. Reemplazo directo para vehículos deportivos.',
        imagenes: [
            'assets/images/prod-003-1.png',
            'assets/images/prod-003-2.png',
            'assets/images/prod-003-3.png'
        ]
    },
    { 
        id: 'prod-004', 
        nombre: 'Kit de Juntas para Motor Z-10', 
        precio: 29.95, 
        stock: 35,
        descripcionCompleta: 'Kit completo de empaques para overhaul de motor Z-10. Incluye junta de culata, juntas de cárter y sellos de válvula. Material de grafito reforzado para máxima resistencia térmica. Asegúrese de limpiar todas las superficies de contacto antes del montaje.',
        imagenes: [
            'assets/images/prod-004-1.png',
            'assets/images/prod-004-2.png'
        ]
    }
];