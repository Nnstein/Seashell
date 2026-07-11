import { addSection, getSections } from '../services/firestoreService';

const defaultSections = [
    {
        name: 'Rooms',
        prefix: '',
        ranges: [
            { min: 101, max: 112 },
            { min: 114, max: 145 },
            { min: 151, max: 162 },
            { min: 201, max: 210 },
            { min: 301, max: 308 },
            { min: 401, max: 412 },
            { min: 414, max: 441 },
            { min: 501, max: 507 },
            { min: 601, max: 608 },
            { min: 701, max: 704 }
        ],
        menu: 'room-service' as const,
        isDefault: true,
        padLength: 0,
        requiresPhone: true
    },
    {
        name: 'Sunbeds',
        prefix: 'SB',
        ranges: [{ min: 1, max: 45 }],
        menu: 'seashell' as const,
        isDefault: true,
        padLength: 3,
        requiresPhone: true
    },
    {
        name: 'Presto Codes',
        prefix: 'P',
        ranges: [{ min: 1, max: 9999 }], // Arbitrary large max for presto
        menu: 'presto' as const,
        isDefault: false,
        padLength: 0,
        requiresPhone: false
    }
];

export const seedInitialSections = async () => {
    const existing = await getSections();
    if (existing.length > 0) {
        console.log("Sections already seeded.");
        return;
    }

    console.log("Seeding default sections...");
    for (const section of defaultSections) {
        await addSection(section);
        console.log(`Added ${section.name}`);
    }
    console.log("Seeding complete!");
};
