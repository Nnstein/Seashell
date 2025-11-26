import React, { useState, useEffect } from 'react';
import { MenuItem, Category } from '../src/types';
import { CATEGORIES } from '../constants';
import { generateMenuDescription } from '../services/geminiService';
import { addMenuItem, updateMenuItem, deleteMenuItem, getMenuItems, updateMenuSettings, getMenuSettings } from '../services/firestoreService';
import { uploadImage } from '../services/storageService';
import SearchBar from './SearchBar';
import { X, Plus, Sparkles, Loader2, Image as ImageIcon, DollarSign, Edit3, Trash2, Calendar, CheckCircle, Upload } from 'lucide-react';

interface MenuEditorProps {
    menu: MenuItem[];
    onUpdate: () => void;
}

const MenuEditor: React.FC<MenuEditorProps> = ({ menu, onUpdate }) => {
    const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
    const [isGenerating, setIsGenerating] = useState(false);
    const [viewSeason, setViewSeason] = useState<'Summer' | 'Winter'>('Summer');
    const [activeSeason, setActiveSeason] = useState<'Summer' | 'Winter'>('Summer');
    const [hasExistingData, setHasExistingData] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Load active season on mount
    const init = async () => {
        if (menu.length > 0) setHasExistingData(true);
        const settings = await getMenuSettings();
        if (settings) setActiveSeason(settings.activeSeason);
    };

    useEffect(() => {
        init();
    }, [menu]);

    const handleEdit = (item: MenuItem) => {
        setEditingItem({ ...item });
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingItem({
            name: '',
            description: '',
            price: 0,
            category: 'Main Course', // Updated default
            menuType: 'All Day',
            image: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 100)}`,
            isAvailable: true,
            season: viewSeason
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            await deleteMenuItem(id);
            onUpdate();
        }
    };

    const handleSaveModal = async () => {
        if (!editingItem || !editingItem.name) return;

        try {
            if (editingItem.id) {
                // Update existing
                await updateMenuItem(editingItem.id, editingItem);
            } else {
                // Create new
                await addMenuItem(editingItem as MenuItem);
            }

            onUpdate();
            setIsModalOpen(false);
            setEditingItem(null);
        } catch (error) {
            console.error("Error saving menu item:", error);
            alert("Failed to save item. Please try again.");
        }
    };

    const handleGenerateAI = async () => {
        if (!editingItem?.name) {
            alert("Please enter a dish name first.");
            return;
        }
        setIsGenerating(true);
        const context = editingItem.description || "Fresh ingredients";
        const result = await generateMenuDescription(editingItem.name, context);

        if (result) {
            setEditingItem(prev => ({
                ...prev,
                description: result.description,
                price: prev?.price || result.suggestedPrice
            }));
        } else {
            alert("Could not generate content. Check API key or try again.");
        }
        setIsGenerating(false);
    };

    const handleSeedDatabase = async () => {
        if (!window.confirm("This will add all default menu items to the database. Continue?")) return;

        const SEED_DATA = [
            // --- Hot Beverages ---
            {
                category: 'Hot Beverages',
                items: [
                    { name: { en: 'Espresso', ar: 'اسبريسو' }, price: 1.000, description: { en: 'Single shot of rich coffee', ar: 'جرعة واحدة من القهوة الغنية' }, sizes: [{ name: 'Single', price: 1.000 }, { name: 'Double', price: 1.250 }] },
                    { name: { en: 'Lungo', ar: 'لونغو' }, price: 1.000, description: { en: 'Long pull espresso', ar: 'اسبريسو طويل' }, sizes: [{ name: 'Single', price: 1.000 }, { name: 'Double', price: 1.250 }] },
                    { name: { en: 'Macchiato', ar: 'ماكياتو' }, price: 1.000, description: { en: 'Espresso with a dash of milk foam', ar: 'اسبريسو مع قليل من رغوة الحليب' }, sizes: [{ name: 'Single', price: 1.000 }, { name: 'Double', price: 1.250 }] },
                    { name: { en: 'Con Panna', ar: 'كون بانا' }, price: 1.250, description: { en: 'Espresso with cream on top', ar: 'اسبريسو مع كريمة' }, sizes: [{ name: 'Single', price: 1.250 }, { name: 'Double', price: 1.500 }] },
                    { name: { en: 'American Coffee', ar: 'قهوة أمريكية' }, price: 1.250, description: { en: 'Classic brewed coffee', ar: 'قهوة مقطرة كلاسيكية' }, sizes: [{ name: 'Single', price: 1.250 }, { name: 'Double', price: 1.500 }] },
                    { name: { en: 'Cappuccino', ar: 'كابتشينو' }, price: 1.500, description: { en: 'Espresso with steamed milk foam', ar: 'اسبريسو مع رغوة الحليب المبخر' }, sizes: [{ name: 'Single', price: 1.500 }, { name: 'Double', price: 1.750 }] },
                    { name: { en: 'Latte', ar: 'لاتيه' }, price: 1.500, description: { en: 'Espresso with steamed milk', ar: 'اسبريسو مع حليب مبخر' }, sizes: [{ name: 'Single', price: 1.500 }, { name: 'Double', price: 1.750 }] },
                    { name: { en: 'Flat White', ar: 'فلات وايت' }, price: 1.500, description: { en: 'Micro-foam milk over espresso', ar: 'رغوة خفيفة فوق الاسبريسو' }, sizes: [{ name: 'Single', price: 1.500 }, { name: 'Double', price: 1.750 }] },
                    { name: { en: 'Caramel Macchiato', ar: 'كراميل ماكياتو' }, price: 1.750, description: { en: 'Vanilla syrup, steamed milk, espresso, caramel drizzle', ar: 'شراب الفانيليا، حليب مبخر، اسبريسو، وصلصة الكراميل' }, sizes: [{ name: 'Single', price: 1.750 }, { name: 'Double', price: 2.000 }] },
                    { name: { en: 'Mocha Caliente', ar: 'موكا كاليانتي' }, price: 1.750, description: { en: 'Hot Mocha', ar: 'موكا ساخنة' }, sizes: [{ name: 'Single', price: 1.750 }, { name: 'Double', price: 2.000 }] },
                    { name: { en: 'White Mocha', ar: 'موكا بيضاء' }, price: 1.750, description: { en: 'White chocolate mocha', ar: 'موكا بالشوكولاتة البيضاء' }, sizes: [{ name: 'Single', price: 1.750 }, { name: 'Double', price: 2.000 }] },
                    { name: { en: 'Chai Latte', ar: 'شاي لاتيه' }, price: 1.250, description: { en: 'Spiced tea with steamed milk', ar: 'شاي متبل مع حليب مبخر' }, sizes: [{ name: 'Single', price: 1.250 }, { name: 'Double', price: 1.500 }] },
                    { name: { en: 'Flavored Latte', ar: 'لاتيه بمختلف النكهات' }, price: 1.750, description: { en: 'Latte with your choice of syrup', ar: 'لاتيه مع اختيارك من النكهات' }, sizes: [{ name: 'Single', price: 1.750 }, { name: 'Double', price: 2.000 }] },
                    { name: { en: 'Tea (flavored)', ar: 'شاي بأنواعه' }, price: 1.000, description: { en: 'Selection of flavored teas', ar: 'تشكيلة من الشاي المنكه' }, sizes: [{ name: 'Single', price: 1.000 }, { name: 'Double', price: 1.250 }] },
                ]
            },
            {
                category: 'Frappes',
                items: [
                    { name: { en: 'Caramel Frappé', ar: 'فرابيه كراميل' }, price: 2.250, description: { en: 'Caramel blended ice drink', ar: 'مشروب مثلج بالكراميل' }, note: 'Served with cream on top' },
                    { name: { en: 'Choco Frappé', ar: 'فرابيه شوكولا' }, price: 2.250, description: { en: 'Chocolate blended ice drink', ar: 'مشروب مثلج بالشوكولاتة' }, note: 'Served with cream on top' },
                    { name: { en: 'Strawberry Frappé', ar: 'فرابيه فراولة' }, price: 2.250, description: { en: 'Strawberry blended ice drink', ar: 'مشروب مثلج بالفراولة' }, note: 'Served with cream on top' },
                    { name: { en: 'Vanilla Frappé', ar: 'فرابيه فانيلا' }, price: 2.250, description: { en: 'Vanilla blended ice drink', ar: 'مشروب مثلج بالفانيليا' }, note: 'Served with cream on top' },
                    { name: { en: 'Honey Vanilla Frappé', ar: 'فرابيه فانيلا بالعسل' }, price: 2.250, description: { en: 'Honey vanilla blended ice drink', ar: 'مشروب مثلج بالفانيليا والعسل' }, note: 'Served with cream on top' },
                    { name: { en: 'Tamarccino', ar: 'تاماريتشينو' }, price: 2.250, description: { en: 'Signature blend mixed with oriental dates', ar: 'خلطتنا الخاصة مع التمر الشرقي' }, note: 'Served with cream on top' },
                ]
            },
            {
                category: 'Smoothies',
                items: [
                    { name: { en: 'Passion fruit Smoothie', ar: 'سموذي باشن فروت' }, price: 1.850, description: { en: 'Passion fruit smoothie', ar: 'سموذي باشن فروت' } },
                    { name: { en: 'Raspberry Smoothie', ar: 'سموذي توت' }, price: 1.850, description: { en: 'Raspberry smoothie', ar: 'سموذي توت' } },
                    { name: { en: 'Peach Smoothie', ar: 'سموذي خوخ' }, price: 1.850, description: { en: 'Peach smoothie', ar: 'سموذي خوخ' } },
                    { name: { en: 'Strawberry Smoothie', ar: 'سموذي فراولة' }, price: 1.850, description: { en: 'Strawberry smoothie', ar: 'سموذي فراولة' } },
                    { name: { en: 'Mango Smoothie', ar: 'سموذي مانجو' }, price: 1.850, description: { en: 'Mango smoothie', ar: 'سموذي مانجو' } },
                    { name: { en: 'Coconut Smoothie', ar: 'سموذي جوز الهند' }, price: 1.850, description: { en: 'Coconut smoothie', ar: 'سموذي جوز الهند' } },
                    { name: { en: 'Red Berries Smoothie', ar: 'سموذي توت أحمر' }, price: 1.850, description: { en: 'Red berries smoothie', ar: 'سموذي توت أحمر' } },
                    { name: { en: 'Banana Smoothie', ar: 'سموذي موز' }, price: 1.850, description: { en: 'Banana smoothie', ar: 'سموذي موز' } },
                ]
            },
            {
                category: 'Milkshakes',
                items: [
                    { name: { en: 'Vanilla Milkshake', ar: 'ميلك شيك فانيلا' }, price: 2.000, description: { en: 'Vanilla milkshake', ar: 'ميلك شيك فانيلا' } },
                    { name: { en: 'Chocolate Milkshake', ar: 'ميلك شيك شوكولا' }, price: 2.000, description: { en: 'Chocolate milkshake', ar: 'ميلك شيك شوكولا' } },
                    { name: { en: 'Strawberry Milkshake', ar: 'ميلك شيك فراولة' }, price: 2.000, description: { en: 'Strawberry milkshake', ar: 'ميلك شيك فراولة' } },
                    { name: { en: 'Banana Milkshake', ar: 'ميلك شيك موز' }, price: 2.000, description: { en: 'Banana milkshake', ar: 'ميلك شيك موز' } },
                    { name: { en: 'Oreo Vanilla Milkshake', ar: 'أوريو فانيلا' }, price: 2.000, description: { en: 'Oreo vanilla milkshake', ar: 'ميلك شيك أوريو فانيلا' } },
                    { name: { en: 'Oreo Chocolate Blended', ar: 'أوريو شوكولا' }, price: 2.000, description: { en: 'Oreo chocolate milkshake', ar: 'ميلك شيك أوريو شوكولا' } },
                ]
            },
            {
                category: 'Hot Chocolates',
                items: [
                    { name: { en: 'Classic Hot Chocolate', ar: 'شوكولاتة ساخنة كلاسيكية' }, price: 1.750, description: { en: 'Rich hot chocolate', ar: 'شوكولاتة ساخنة غنية' } },
                    { name: { en: 'White Hot Chocolate', ar: 'شوكولاتة بيضاء ساخنة' }, price: 1.750, description: { en: 'Rich white hot chocolate', ar: 'شوكولاتة بيضاء ساخنة غنية' } },
                    { name: { en: 'Caramel Hot Chocolate', ar: 'شوكولاتة ساخنة بالكراميل' }, price: 2.000, description: { en: 'Hot chocolate with caramel', ar: 'شوكولاتة ساخنة مع كراميل' } },
                    { name: { en: 'Hazelnut Hot Chocolate', ar: 'شوكولاتة ساخنة بالبندق' }, price: 2.000, description: { en: 'Hot chocolate with hazelnut', ar: 'شوكولاتة ساخنة مع بندق' } },
                    { name: { en: 'Dark Hot Chocolate', ar: 'شوكولاتة داكنة ساخنة' }, price: 1.750, description: { en: 'Rich dark hot chocolate', ar: 'شوكولاتة داكنة ساخنة غنية' } },
                    { name: { en: 'Spiced Hot Chocolate', ar: 'شوكولاتة ساخنة متبلة' }, price: 2.000, description: { en: 'Hot chocolate with spices', ar: 'شوكولاتة ساخنة مع توابل' } },
                ]
            },
            {
                category: 'Fresh Juices',
                items: [
                    { name: { en: 'Orange Juice', ar: 'عصير برتقال' }, price: 2.000, description: { en: 'Fresh orange juice', ar: 'عصير برتقال طازج' } },
                    { name: { en: 'Lemonade', ar: 'ليمونادة' }, price: 2.000, description: { en: 'Fresh lemonade', ar: 'ليمونادة طازجة' } },
                ]
            },
            {
                category: 'Specialty Coffee',
                items: [
                    { name: { en: 'V60', ar: 'V60' }, price: 2.500, description: { en: 'Pour over coffee', ar: 'قهوة مقطرة' } },
                    { name: { en: 'Chemex', ar: 'كيمكس' }, price: 2.750, description: { en: 'Pour over coffee', ar: 'قهوة مقطرة' } },
                ]
            },
            {
                category: 'Cold Beverages',
                items: [
                    { name: { en: 'Iced Caffe Americano', ar: 'آيس كافيه أمريكانو' }, price: 1.750, description: { en: 'Espresso over ice and water', ar: 'اسبريسو مع ثلج وماء' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Iced Caffe Latte', ar: 'آيس كافيه لاتيه' }, price: 1.950, description: { en: 'Espresso and cold milk over ice', ar: 'اسبريسو وحليب بارد مع ثلج' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Iced Blended Latte', ar: 'قهوة لاتيه مخفوقة بالثلج' }, price: 1.950, description: { en: 'Blended iced latte', ar: 'لاتيه مثلج مخفوق' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Iced Vanilla Latte', ar: 'لاتيه بالفانيلا مثلجة' }, price: 2.000, description: { en: 'Iced latte with vanilla', ar: 'لاتيه مثلج مع فانيليا' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Iced Mocha', ar: 'موكا مثلجة' }, price: 2.000, description: { en: 'Iced coffee with chocolate', ar: 'قهوة مثلجة مع شوكولاتة' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Iced White Chocolate Mocha', ar: 'شوكولا موكا بيضاء مثلجة' }, price: 2.000, description: { en: 'Iced coffee with white chocolate', ar: 'قهوة مثلجة مع شوكولاتة بيضاء' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Iced Caramel Macchiato', ar: 'كراميل ماكياتو مثلجة' }, price: 2.000, description: { en: 'Iced macchiato with caramel', ar: 'ماكياتو مثلج مع كراميل' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Cream Iced Blended', ar: 'كريما مخفوقة بالثلج' }, price: 1.500, description: { en: 'Strawberry, choco, or caramel', ar: 'فراولة، شوكولاتة، أو كراميل' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Cold Chocolate (kids)', ar: 'شوكولا باردة للأطفال' }, price: 1.750, description: { en: 'Cold chocolate drink', ar: 'مشروب شوكولاتة بارد' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Iced Chai Latte', ar: 'شاي لاتيه مثلج' }, price: 1.750, description: { en: 'Iced spiced tea latte', ar: 'شاي لاتيه متبل مثلج' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Iced Tea Homemade', ar: 'شاي مثلج بريستو' }, price: 1.750, description: { en: 'Lemon, peach or raspberry', ar: 'ليمون، خوخ أو توت' }, addons: [{ name: 'Addon', price: 0.250 }] },
                ]
            },
            {
                category: 'Cocktails',
                items: [
                    { name: { en: 'Cinderella', ar: 'سندريلا' }, price: 2.250, description: { en: 'Refreshing cocktail', ar: 'كوكتيل منعش' } },
                    { name: { en: 'Cucumber Mojito', ar: 'موهيتو بنكهة الخيار' }, price: 2.250, description: { en: 'Cucumber mojito', ar: 'موهيتو خيار' } },
                    { name: { en: 'Blue Sky', ar: 'بلو سكاي' }, price: 2.250, description: { en: 'Blue sky cocktail', ar: 'كوكتيل بلو سكاي' } },
                    { name: { en: 'Strawberry Margarita', ar: 'مارغريتا الفراولة' }, price: 2.250, description: { en: 'Strawberry margarita', ar: 'مارغريتا فراولة' } },
                    { name: { en: 'Avocado Ranchero', ar: 'رانشيرو أفوكادو' }, price: 2.500, description: { en: 'Avocado cocktail', ar: 'كوكتيل أفوكادو' } },
                    { name: { en: 'Virgin Pina Colada', ar: 'فيرجن بينا كولادا' }, price: 2.250, description: { en: 'Pina colada', ar: 'بينا كولادا' } },
                ]
            },
            {
                category: 'Malt Beverages',
                items: [
                    { name: { en: 'Holsten', ar: 'هولستن' }, price: 1.250, description: { en: 'Non-alcoholic malt beverage', ar: 'شراب شعير خالي من الكحول' } },
                    { name: { en: 'Budweiser', ar: 'بدوايزر' }, price: 1.250, description: { en: 'Non-alcoholic malt beverage', ar: 'شراب شعير خالي من الكحول' } },
                    { name: { en: 'Barbican', ar: 'باربيكان' }, price: 1.250, description: { en: 'Strawberry, pomegranate, raspberry...', ar: 'فراولة، رمان، توت...' } },
                ]
            },
            {
                category: 'Refreshing Drinks',
                items: [
                    { name: { en: 'Water Small', ar: 'ماء صغير' }, price: 0.750, description: { en: 'Small mineral water', ar: 'مياه معدنية صغيرة' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Water Large', ar: 'ماء كبير' }, price: 1.250, description: { en: 'Large mineral water', ar: 'مياه معدنية كبيرة' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Soft Drinks', ar: 'مشروبات غازية' }, price: 0.500, description: { en: 'Cola, Fanta, Sprite, Cola Light', ar: 'كولا، فانتا، سبرايت، كولا لايت' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Sparkling Water Small', ar: 'مياه غازية صغيرة' }, price: 1.000, description: { en: 'Small sparkling water', ar: 'مياه غازية صغيرة' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Sparkling Water Large', ar: 'مياه غازية كبيرة' }, price: 1.750, description: { en: 'Large sparkling water', ar: 'مياه غازية كبيرة' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Energy Drinks', ar: 'مشروبات الطاقة' }, price: 1.250, description: { en: 'Energy drink', ar: 'مشروب طاقة' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Add-on Syrups', ar: 'إضافة سيروب' }, price: 0.250, description: { en: 'Strawberry, pomegranate, berries...', ar: 'فراولة، رمان، توت...' }, addons: [{ name: 'Addon', price: 0.250 }] },
                ]
            },
            // --- Appetizers, Soups, Salads ---
            // --- Appetizers, Soups, Salads ---
            {
                category: 'Appetizers',
                items: [
                    { name: { en: 'Bruschetta', ar: 'بروشيتا' }, price: 2.250, description: { en: 'Oven baked sliced bread, topped with tomato, basil, olives & olive oil', ar: 'خبز محمص بالفرن مغطى بالطماطم والريحان والزيتون وزيت الزيتون' } },
                    { name: { en: 'Mozzarella Sticks', ar: 'أصابع الموزاريلا' }, price: 2.000, description: { en: '5 pcs of cheese sticks with pomodoro sauce', ar: '٥ قطع من أصابع الجبن مع صلصة البومودورو' } },
                    { name: { en: 'Arancini', ar: 'أرانسيني' }, price: 2.500, description: { en: 'Served with tomato and basil sauce', ar: 'تقدم مع صلصة الطماطم والريحان' } },
                    { name: { en: 'Mini Calzones', ar: 'ميني كالزونز' }, price: 2.750, description: { en: 'Stuffed with spinach and ricotta served with pomodoro sauce', ar: 'محشية بجبنة الريكوتا والسبانخ، تقدم مع صلصة الطماطم' } },
                    { name: { en: 'Fritto Misto', ar: 'فريتو ميستو' }, price: 3.500, description: { en: 'Assorted fried seafood accompanied with tartar sauce', ar: 'مأكولات بحرية متنوعة مقلية تقدم مع صلصة التارتار' } },
                ]
            },
            {
                category: 'Italian Pasta',
                items: [
                    { name: { en: "Penne all'Arrabbiata", ar: 'بيني أرابياتا' }, price: 3.500, description: { en: 'Tomato Sauce, Garlic, Crushed Chili with parmesan cheese', ar: 'صلصة الطماطم، ثوم، تشيلي مع جبن البارميزان' } },
                    { name: { en: 'Spaghetti alla Bolognese', ar: 'سباغيتي بولونيز' }, price: 4.000, description: { en: 'Tomato Sauce, Minced Beef Meat', ar: 'صلصة الطماطم، لحم بقري مفروم' } },
                    { name: { en: 'Fettuccine Alfredo', ar: 'فيتوتشيني ألفريدو' }, price: 3.500, description: { en: 'Sautéed Mushroom & garlic with Cream Sauce and Parmesan Cheese', ar: 'مشروم سوتيه & ثوم مع صلصة الكريمة وجبن البارميزان' } },
                    { name: { en: 'Fusilli alla Rosa', ar: 'فوسيلي ألا روزا' }, price: 3.250, description: { en: 'Cream & tomato mixed sauce', ar: 'كريمة & طماطم مع صلصة' } },
                    { name: { en: 'Ravioli alla Ricotta', ar: 'رافيولي ريكوتا' }, price: 3.500, description: { en: 'Stuffed pasta dough with fresh spinach, ricotta and parmesan cheese, served with cream sauce', ar: 'باستا محشية بالسبانخ الطازج وجبنة البارميزان تقدم مع صلصة الكريمة' } },
                    { name: { en: 'Ravioli ai Funghi', ar: 'رافيولي فونغي' }, price: 3.500, description: { en: 'Stuffed pasta dough with fresh mushrooms & parmesan cheese, served with cream sauce', ar: 'باستا محشية بالفطر الطازج وجبنة البارميزان تقدم مع صلصة الكريمة' } },
                    { name: { en: 'Gnocchi Aglio Olio', ar: 'نيوكي أليو أوليو' }, price: 3.500, description: { en: 'Dumplings Stuffed with cheese & potato in garlic & olive oil sauce', ar: 'باستا محشية بالجبنة والبطاطا في صلصة الثوم وزيت الزيتون' } },
                ]
            },
            {
                category: 'Soups',
                items: [
                    { name: { en: 'Minestrone', ar: 'مينستروني' }, price: 1.750, description: { en: 'Fresh seasonal diced vegetables & fresh tomato sauce', ar: 'خضار مقطعة طازجة مع صلصة الطماطم' } },
                    { name: { en: 'Cappuccino Mushroom Soup', ar: 'شوربة كابتشينو الفطر' }, price: 1.750, description: { en: 'Sautéed Portobello mushroom with Fresh cream served with garlic bread', ar: 'فطر بورتوبيلو سوتيه مع كريمة طازجة، يقدم مع خبز الثوم' } },
                ]
            },
            {
                category: 'Salads',
                items: [
                    { name: { en: 'Prawn Greek Salad', ar: 'سلطة يونانية بالروبيان' }, price: 3.750, description: { en: 'Crispy shrimps, Mix green leaves, tomato, cucumber, feta cheese, onion, oregano dressing', ar: 'روبيان مقرمش، تشكيلة من أوراق الخس الطازج، طماطم، خيار، جبنة فيتا، بصل وصلصة أوريغانو' } },
                    { name: { en: "Chicken Caesar Salad", ar: 'سلطة سيزر بالدجاج' }, price: 3.250, description: { en: 'Romaine lettuce, parmesan Flakes, croutons and grilled chicken breast with traditional Caesar', ar: 'خس روماني، رقائق البارميزان مع صدر دجاج مشوي وصلصة السيزر' } },
                    { name: { en: 'Mozzarella Antipasto', ar: 'موزاريلا أنتي باستو' }, price: 2.750, description: { en: 'Fresh Buffalo mozzarella, tomato, Crispy green leaves, Grilled eggplant, grilled zucchini & roasted bell pepper with olive oil', ar: 'موزاريلا بافالو طازجة، طماطم، تشكيلة من أوراق الخس الطازج، كوسا وباذنجان مشوي، فليفلة مع زيت الزيتون' } },
                    { name: { en: 'Insalata Fresca', ar: 'إنسالاتا فريسكا' }, price: 2.750, description: { en: 'Lettuce, Tuna, Mushrooms, Onion, Olives, Mix Peppers, Capers & Parmesan cheese, dressed with vinegar & olive oil', ar: 'خس، تونة، فطر، بصل، زيتون، فليفلة، كبر وجبنة البارميزان وصلصة الخل وزيت الزيتون' } },
                    { name: { en: 'Pasta & Basil Salad', ar: 'سلطة باستا مع الريحان' }, price: 2.500, description: { en: 'Fusilli pasta, with fresh tomato sauce, basil & garlic topped with shaved parmesan', ar: 'باستا فوسيلي مع صلصة طماطم طازجة، الريحان الأخضر والثوم مغطاة بشرائح البارميزان' } },
                ]
            },
            {
                category: 'Risotto',
                items: [
                    { name: { en: 'Risotto ai Funghi', ar: 'ريزوتو فونغي' }, price: 3.000, description: { en: 'Italian Risotto with Porcini Mushroom and shaved parmesan cheese', ar: 'ريزوتو إيطالي مع فطر البورسيني وشرائح جبنة البارميزان' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Risotto al Pollo', ar: 'ريزوتو بولو' }, price: 3.500, description: { en: 'Chicken, Fresh Mushrooms, Parmesan and white sauce', ar: 'دجاج، فطر طازج، بارميزان وصلصة بيضاء' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Risotto di Mare', ar: 'ريزوتو دي ماري' }, price: 4.000, description: { en: 'Selection of seafood in tomato sauce', ar: 'تشكيلة من المأكولات البحرية في صلصة الطماطم' }, addons: [{ name: 'Addon', price: 0.250 }] },
                    { name: { en: 'Risotto alla Vegetariana', ar: 'ريزوتو فيجيتريانا' }, price: 3.500, description: { en: 'Mix peppers, mushrooms, onion and white sauce', ar: 'فليفلة، فطر، بصل وصلصة بيضاء' }, addons: [{ name: 'Addon', price: 0.250 }] },
                ]
            },
            // --- Pizzeria & Pasta ---
            {
                category: 'Pizzeria Chez Nous',
                items: [
                    { name: { en: 'Margherita', ar: 'مارغريتا' }, price: 3.250, description: { en: 'Tomato Sauce, Mozzarella Cheese', ar: 'صلصة طماطم، جبنة موزاريلا' } },
                    { name: { en: 'Quattro Stagioni', ar: 'كواترو ستاجيوني' }, price: 3.500, description: { en: 'Tomato Sauce, Mozzarella, Mushrooms', ar: 'صلصة طماطم، موزاريلا، فطر' } },
                    { name: { en: 'Pepperoni', ar: 'بيبروني' }, price: 4.000, description: { en: 'Tomato Sauce, Mozzarella Cheese, Pepperoni', ar: 'صلصة طماطم، موزاريلا، بيبروني' } },
                    { name: { en: 'Vegetariana', ar: 'فيجيتريانا' }, price: 3.500, description: { en: 'Tomato Sauce, Mozzarella Cheese, Full Colored Capsicum, Zucchini, Eggplant, Fresh Tomatoes', ar: 'صلصة الطماطم، جبنة موزاريلا، فليفلة ملونة، كوسا، باذنجان، طماطم طازجة' } },
                    { name: { en: 'Quattro Formaggi', ar: 'كواترو فورماجي' }, price: 3.750, description: { en: 'Tomato Sauce, Mozzarella, Cheddar, Parmesan, Blue Cheese', ar: 'صلصة الطماطم، موزاريلا، تشيدر، بارميجانو وجبنة زرقاء' } },
                    { name: { en: 'Mozzarella di Bufala', ar: 'بيتزا بافالو' }, price: 3.750, description: { en: 'Fresh Buffalo Mozzarella, Tomato, Topped with Rocca Leaves', ar: 'جبنة موزاريلا بافالو طازجة، طماطم مع أوراق الجرجير' } },
                    { name: { en: 'Pizza Tre Gusti', ar: 'تري غاستي' }, price: 3.750, description: { en: 'Mushroom, Pepperoni, Black Olives and mozzarella cheese', ar: 'فطر، بيبروني، زيتون أسود وجبنة الموزاريلا' } },
                    { name: { en: 'Pizza al Pollo', ar: 'بيتزا بولو' }, price: 3.750, description: { en: 'Tomato, Mozzarella, Chicken in BBQ sauce', ar: 'طماطم، موزاريلا، دجاج بصلصة الباربيكيو' } },
                    { name: { en: 'Pizza al Tonno', ar: 'بيتزا أل تونو' }, price: 3.750, description: { en: 'Tomato, Mozzarella, Onion, Tuna, Olives, Basil', ar: 'طماطم، موزاريلا، بصل، تونة، زيتون، ريحان' } },
                    { name: { en: 'Marinara', ar: 'مارينارا' }, price: 4.500, description: { en: 'Tomato Sauce, Mozzarella Cheese, Salmon, Calamari, Prawns', ar: 'صلصة الطماطم، جبنة موزاريلا، سالمون، كالاماري، روبيان' } },
                ]
            },
            {
                category: 'Main Course',
                items: [
                    { name: { en: 'Pollo ai Funghi', ar: 'بولو أي فونغي' }, price: 4.500, description: { en: 'Oven roasted chicken breast with mushroom cream sauce, roasted potato, and grilled vegetables', ar: 'صدر دجاج مشوي مع صلصة الكريمة والبارميزان، بطاطا وخضار مشوية' } },
                    { name: { en: 'Carne al Forno', ar: 'كارني ال فورنو' }, price: 6.000, description: { en: 'Veal Tenderloin, with sautéed green beans, mashed potato and thyme gravy', ar: 'لحم عجل تندرلوين مع فاصوليا خضراء سوتيه، بطاطا مهروسة وصلصة الزعتر' } },
                    { name: { en: 'Salmone al Forno', ar: 'سالمون ألفورنو' }, price: 6.500, description: { en: 'Baked darne of Salmon, topped with crust of pistachio and olive oil', ar: 'فيليه سلمون مغطاة بطبقة من الفستق الحلبي مع زيت الزيتون' } },
                    { name: { en: 'Pollo alla Milanese', ar: 'بولو ميلانيز' }, price: 3.500, description: { en: 'Fried chicken escalope, topped with lemon, tomato sauce & basil', ar: 'صدر دجاج إسكالوب مع الليمون، صلصة الطماطم والريحان' } },
                    { name: { en: 'Sea Bass', ar: 'سي باس' }, price: 6.750, description: { en: 'Fillet grilled to perfection accompanied with Mashed Potato & grilled vegetables', ar: 'سمك فيليه مشوي يقدم مع البطاطا المهروسة والخضار المشوية' } },
                ]
            },
            // --- Sweets and Fruits ---
            {
                category: 'Sweets and Fruits',
                items: [
                    { name: { en: 'Homemade Philadelphia Cheesecake', ar: 'تشيزكيك فيلادلفيا' }, price: 2.250, description: { en: 'Homemade creamy cheesecake', ar: 'تشيز كيك كريمي منزلي الصنع' } },
                    { name: { en: 'Homemade Chocolate Brownies', ar: 'براوني الشوكولا' }, price: 2.250, description: { en: 'Homemade rich chocolate brownies', ar: 'براونيز شوكولاتة غنية منزلية الصنع' } },
                    { name: { en: 'Homemade Italian Tiramisu', ar: 'التيراميسو الإيطالية' }, price: 2.250, description: { en: 'Classic Italian Tiramisu', ar: 'تيراميسو إيطالي كلاسيكي' } },
                    { name: { en: 'American Cakes', ar: 'الكيك الأمريكي' }, price: 2.500, description: { en: 'Assorted American cakes', ar: 'كيك أمريكي متنوع' } },
                    { name: { en: 'Muffins', ar: 'مافن' }, price: 0.950, description: { en: 'Freshly baked muffins', ar: 'مافن طازج' } },
                    { name: { en: 'Croissants', ar: 'كروسان' }, price: 1.000, description: { en: 'Freshly baked croissants', ar: 'كروسان طازج' } },
                    { name: { en: 'Fresh Fruit salad', ar: 'سلطة فواكه طازجة' }, price: 2.000, description: { en: 'Seasonal fresh fruit salad', ar: 'سلطة فواكه موسمية طازجة' } },
                    { name: { en: 'Fresh Fruit Cuts', ar: 'فواكه طازجة مقطعة' }, price: 1.500, description: { en: 'Sliced fresh fruits', ar: 'فواكه طازجة مقطعة' } },
                ]
            }
        ];

        try {
            // 1. Delete existing items
            console.log("Deleting existing items...");
            const itemsToDelete = [...menu];
            let deleteCount = 0;
            for (const item of itemsToDelete) {
                if (item.id) {
                    await deleteMenuItem(item.id);
                    deleteCount++;
                    if (deleteCount % 5 === 0) await new Promise(r => setTimeout(r, 200)); // Throttle deletions
                }
            }

            // 2. Add new items
            let addCount = 0;
            for (const cat of SEED_DATA) {
                for (const item of cat.items) {
                    await addMenuItem({
                        name: item.name,
                        description: item.description,
                        price: item.price,
                        category: cat.category as any,
                        menuType: 'All Day',
                        isAvailable: true,
                        season: 'Summer',
                        sizes: (item as any).sizes || [],
                        addons: (item as any).addons || [],
                        note: (item as any).note || '',
                        images: []
                    });
                    addCount++;
                    if (addCount % 5 === 0) await new Promise(r => setTimeout(r, 200)); // Throttle additions
                }
            }
            alert(`Successfully re-seeded database! Deleted ${deleteCount} old items and added ${addCount} new items.`);
            onUpdate();
        } catch (error) {
            console.error("Error seeding database:", error);
            alert("Error seeding database. Check console.");
        }
    };

    const handlePublishSeason = async () => {
        const newSeason = activeSeason === 'Summer' ? 'Winter' : 'Summer';
        await updateMenuSettings({ activeSeason: newSeason });
        setActiveSeason(newSeason);
    };

    const filteredMenu = menu.filter(item => {
        // Filter by category
        const categoryMatch = filterCategory === 'All' || item.category === filterCategory;

        // Filter by season
        const seasonMatch = item.season === viewSeason || (!item.season && viewSeason === 'Summer');

        // Filter by search query
        let searchMatch = true;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const name = typeof item.name === 'object' ? item.name.en : item.name;
            const description = typeof item.description === 'object' ? item.description.en : item.description;
            const category = item.category;

            searchMatch = (
                name.toLowerCase().includes(query) ||
                description?.toLowerCase().includes(query) ||
                category.toLowerCase().includes(query)
            );
        }

        return categoryMatch && seasonMatch && searchMatch;
    });

    return (
        <div className="h-full flex flex-col p-6 md:p-8">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-ink">Menu Curation</h2>
                    <p className="text-slate-500 font-serif italic mt-1">Design the guest dining experience</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Season Switcher */}
                    {/* Season Switcher */}
                    <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center gap-2">
                        <div className="flex">
                            <button
                                onClick={() => setViewSeason('Summer')}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${viewSeason === 'Summer' ? 'bg-gold text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Summer
                            </button>
                            <button
                                onClick={() => setViewSeason('Winter')}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${viewSeason === 'Winter' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Winter
                            </button>
                        </div>

                        {/* Explicit Publish Button */}
                        {activeSeason !== viewSeason && (
                            <button
                                onClick={async () => {
                                    if (window.confirm(`Make ${viewSeason} menu live?`)) {
                                        await updateMenuSettings({ activeSeason: viewSeason });
                                        setActiveSeason(viewSeason);
                                    }
                                }}
                                className="ml-2 px-3 py-1 bg-green-500 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-green-600 transition-colors shadow-sm"
                            >
                                Publish {viewSeason}
                            </button>
                        )}
                    </div>

                    {/* Live Indicator (Read Only) */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live:</span>
                        <div
                            className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors ${activeSeason === 'Summer' ? 'bg-gold/10 text-gold' : 'bg-blue-500/10 text-blue-500'}`}
                        >
                            {activeSeason === 'Summer' ? <Sparkles size={14} /> : <Calendar size={14} />}
                            {activeSeason}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleSeedDatabase}
                            className="px-4 py-3 transition-colors font-bold uppercase tracking-wider text-xs flex items-center shadow-sm rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                            title="Seed database with initial data (will replace existing)"
                        >
                            <Sparkles size={16} className="mr-2" /> Seed DB
                        </button>
                        <button
                            onClick={handleAddNew}
                            className="bg-ink text-white hover:bg-gold hover:text-ink px-6 py-3 transition-colors font-bold uppercase tracking-wider text-xs flex items-center shadow-lg"
                        >
                            <Plus size={16} className="mr-2" /> Add New Dish
                        </button>
                    </div>
                </div>

            </div>

            {/* Search Bar */}
            <div className="mb-6 max-w-md">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search menu items..."
                />
            </div>

            {/* Categories */}
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 border-b-2 border-slate-200 bg-paper flex-shrink-0">
                <button
                    onClick={() => setFilterCategory('All')}
                    className={`px-6 py-2 font-serif text-sm transition-all whitespace-nowrap border ${filterCategory === 'All' ? 'bg-ink text-white border-ink' : 'text-slate-700 hover:text-ink hover:bg-slate-100 border-slate-300 bg-white'}`}
                >
                    All Collection
                </button>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat as Category)}
                        className={`px-6 py-2 font-serif text-sm transition-all whitespace-nowrap border ${filterCategory === cat ? 'bg-ink text-white border-ink' : 'text-slate-700 hover:text-ink hover:bg-slate-100 border-slate-300 bg-white'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid - Scrollable Container */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                    {filteredMenu.map(item => (
                        <div key={item.id} className="bg-white p-4 group hover:shadow-xl transition-all duration-500 border border-slate-100 relative flex flex-col">
                            <div className="h-48 overflow-hidden mb-4 relative">
                                <img
                                    src={item.image || item.imageUrl}
                                    alt={typeof item.name === 'object' ? item.name.en : item.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                                />
                                <div className="absolute inset-0 border-4 border-white/20 pointer-events-none"></div>

                                {/* Hover Overlay Controls */}
                                <div className="absolute inset-0 bg-black/5 transition-all duration-300 opacity-0 group-hover:opacity-100 flex justify-between items-start p-3 z-10">
                                    <span className="bg-white/95 backdrop-blur text-ink text-[10px] font-bold uppercase tracking-widest px-2 py-1 shadow-sm border border-slate-100 transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                        {item.category}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                        className="bg-white text-ink p-2 rounded-full hover:bg-gold hover:text-white transition-colors shadow-lg transform -translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
                                        title="Edit Dish"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                </div>

                                {!item.available && !item.isAvailable && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center pointer-events-none z-20">
                                        <span className="font-bold text-ink uppercase tracking-wider border-2 border-ink px-3 py-1">Sold Out</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-serif font-bold text-lg text-ink leading-tight group-hover:text-gold transition-colors">
                                        {typeof item.name === 'object' ? item.name.en : item.name}
                                    </h3>
                                    <span className="font-serif font-bold text-ink ml-2">{item.price.toFixed(3)} KD</span>
                                </div>
                                <p className="text-slate-500 text-sm line-clamp-3 font-light leading-relaxed">
                                    {typeof item.description === 'object' ? item.description.en : item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit Modal */}
            {
                isModalOpen && editingItem && (
                    <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-paper w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-t-8 border-gold animate-in fade-in zoom-in-95 duration-300 flex flex-col">
                            <div className="p-8 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-paper z-10">
                                <div>
                                    <h3 className="text-2xl font-serif font-bold text-ink">{editingItem.id?.length! > 5 ? 'Edit Masterpiece' : 'New Creation'}</h3>
                                    <p className="text-slate-500 italic font-serif text-sm">Refine the culinary details</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-ink transition-colors"><X size={24} /></button>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* High contrast input group */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Dish Name</label>
                                    <input
                                        type="text"
                                        value={typeof editingItem.name === 'object' ? editingItem.name.en : editingItem.name}
                                        onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                        className="w-full p-3 border-2 border-slate-300 text-ink font-serif text-lg placeholder-slate-400 focus:border-gold focus:ring-0 outline-none bg-white transition-colors shadow-sm"
                                        placeholder="e.g. Truffle Risotto"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Category</label>
                                        <div className="relative">
                                            <select
                                                value={editingItem.category}
                                                onChange={e => setEditingItem({ ...editingItem, category: e.target.value as Category })}
                                                className="w-full p-3 border-2 border-slate-300 text-ink font-sans bg-white focus:border-gold focus:ring-0 outline-none appearance-none cursor-pointer shadow-sm"
                                            >
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">▼</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Price (KWD)</label>
                                        <div className="relative">
                                            <DollarSign size={16} className="absolute left-3 top-4 text-slate-400" />
                                            <input
                                                type="number"
                                                value={editingItem.price}
                                                onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                                                className="w-full pl-8 p-3 border-2 border-slate-300 text-ink font-serif font-bold text-lg bg-white focus:border-gold focus:ring-0 outline-none shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Season & Note */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Season</label>
                                        <div className="flex gap-4 p-3 border-2 border-slate-300 bg-white">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="season"
                                                    value="Summer"
                                                    checked={editingItem.season === 'Summer'}
                                                    onChange={() => setEditingItem({ ...editingItem, season: 'Summer' })}
                                                    className="text-gold focus:ring-gold"
                                                />
                                                <span className="text-sm font-serif">Summer</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="season"
                                                    value="Winter"
                                                    checked={editingItem.season === 'Winter'}
                                                    onChange={() => setEditingItem({ ...editingItem, season: 'Winter' })}
                                                    className="text-gold focus:ring-gold"
                                                />
                                                <span className="text-sm font-serif">Winter</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Note</label>
                                        <input
                                            type="text"
                                            value={editingItem.note || ''}
                                            onChange={e => setEditingItem({ ...editingItem, note: e.target.value })}
                                            className="w-full p-3 border-2 border-slate-300 text-ink font-sans text-sm placeholder-slate-400 focus:border-gold focus:ring-0 outline-none bg-white shadow-sm"
                                            placeholder="e.g. Served with cream"
                                        />
                                    </div>
                                </div>

                                {/* Sizes */}
                                <div className="space-y-2 bg-slate-50 p-4 border border-slate-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider">Sizes</label>
                                        <button
                                            onClick={() => setEditingItem({ ...editingItem, sizes: [...(editingItem.sizes || []), { name: '', price: 0 }] })}
                                            className="text-xs text-gold font-bold uppercase tracking-wider flex items-center hover:text-amber-600"
                                        >
                                            <Plus size={12} className="mr-1" /> Add Size
                                        </button>
                                    </div>
                                    {editingItem.sizes?.map((size, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="Size Name"
                                                value={size.name}
                                                onChange={e => {
                                                    const newSizes = [...editingItem.sizes!];
                                                    newSizes[index].name = e.target.value;
                                                    setEditingItem({ ...editingItem, sizes: newSizes });
                                                }}
                                                className="flex-1 p-2 border border-slate-300 text-sm"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={size.price}
                                                onChange={e => {
                                                    const newSizes = [...editingItem.sizes!];
                                                    newSizes[index].price = parseFloat(e.target.value);
                                                    setEditingItem({ ...editingItem, sizes: newSizes });
                                                }}
                                                className="w-24 p-2 border border-slate-300 text-sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newSizes = editingItem.sizes!.filter((_, i) => i !== index);
                                                    setEditingItem({ ...editingItem, sizes: newSizes });
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!editingItem.sizes || editingItem.sizes.length === 0) && <p className="text-xs text-slate-400 italic">No specific sizes defined.</p>}
                                </div>

                                {/* Addons */}
                                <div className="space-y-2 bg-slate-50 p-4 border border-slate-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider">Addons</label>
                                        <button
                                            onClick={() => setEditingItem({ ...editingItem, addons: [...(editingItem.addons || []), { name: '', price: 0 }] })}
                                            className="text-xs text-gold font-bold uppercase tracking-wider flex items-center hover:text-amber-600"
                                        >
                                            <Plus size={12} className="mr-1" /> Add Addon
                                        </button>
                                    </div>
                                    {editingItem.addons?.map((addon, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="Addon Name"
                                                value={addon.name}
                                                onChange={e => {
                                                    const newAddons = [...editingItem.addons!];
                                                    newAddons[index].name = e.target.value;
                                                    setEditingItem({ ...editingItem, addons: newAddons });
                                                }}
                                                className="flex-1 p-2 border border-slate-300 text-sm"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={addon.price}
                                                onChange={e => {
                                                    const newAddons = [...editingItem.addons!];
                                                    newAddons[index].price = parseFloat(e.target.value);
                                                    setEditingItem({ ...editingItem, addons: newAddons });
                                                }}
                                                className="w-24 p-2 border border-slate-300 text-sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newAddons = editingItem.addons!.filter((_, i) => i !== index);
                                                    setEditingItem({ ...editingItem, addons: newAddons });
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!editingItem.addons || editingItem.addons.length === 0) && <p className="text-xs text-slate-400 italic">No addons defined.</p>}
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-ink uppercase tracking-wider">Description</label>
                                        <button
                                            onClick={handleGenerateAI}
                                            disabled={isGenerating || !editingItem.name}
                                            className="text-xs flex items-center text-gold hover:text-amber-600 font-bold uppercase tracking-widest disabled:opacity-50 transition-colors"
                                        >
                                            {isGenerating ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                                            {isGenerating ? 'Crafting...' : 'AI Enhance'}
                                        </button>
                                    </div>
                                    <textarea
                                        value={typeof editingItem.description === 'object' ? editingItem.description.en : editingItem.description}
                                        onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                        rows={4}
                                        className="w-full p-3 border-2 border-slate-300 text-ink font-sans leading-relaxed placeholder-slate-400 focus:border-gold focus:ring-0 outline-none bg-white shadow-sm resize-none"
                                        placeholder="Describe the dish ingredients..."
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Images (Max 5)</label>

                                    {/* Image Preview Grid */}
                                    <div className="grid grid-cols-5 gap-2 mb-2">
                                        {editingItem.images?.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square border border-slate-200 rounded overflow-hidden group">
                                                <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => {
                                                        const newImages = editingItem.images!.filter((_, i) => i !== idx);
                                                        setEditingItem({ ...editingItem, images: newImages });
                                                    }}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {/* Fallback for legacy single image */}
                                        {!editingItem.images && editingItem.image && (
                                            <div className="relative aspect-square border border-slate-200 rounded overflow-hidden group">
                                                <img src={editingItem.image} alt="Legacy Preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setEditingItem({ ...editingItem, image: '' })}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 items-center">
                                        <label className={`flex-1 flex items-center justify-center border-2 border-dashed border-slate-300 p-4 rounded cursor-pointer hover:border-gold hover:bg-gold/5 transition-colors ${((editingItem.images?.length || 0) >= 5) ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={async (e) => {
                                                    if (e.target.files) {
                                                        const files: File[] = Array.from(e.target.files);
                                                        const remainingSlots = 5 - (editingItem.images?.length || 0);
                                                        const filesToUpload = files.slice(0, remainingSlots);

                                                        // Upload logic would go here
                                                        // For now, we'll just simulate or use a placeholder if no backend upload is ready
                                                        // BUT we have storageService now!

                                                        const uploadedUrls: string[] = [];
                                                        for (const file of filesToUpload) {
                                                            try {
                                                                const path = `menu_items/${Date.now()}_${file.name}`;
                                                                const url = await uploadImage(file, path);
                                                                uploadedUrls.push(url);
                                                            } catch (err) {
                                                                console.error("Upload failed", err);
                                                                alert("Failed to upload image");
                                                            }
                                                        }

                                                        setEditingItem(prev => ({
                                                            ...prev!,
                                                            images: [...(prev!.images || []), ...uploadedUrls]
                                                        }));
                                                    }
                                                }}
                                            />
                                            <div className="flex flex-col items-center text-slate-400">
                                                <Upload size={24} className="mb-1" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Upload Images</span>
                                            </div>
                                        </label>

                                        <div className="relative flex-1">
                                            <ImageIcon size={16} className="absolute left-3 top-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Or paste URL..."
                                                value={editingItem.image || ''}
                                                onChange={e => {
                                                    // Legacy support: update 'image' field directly
                                                    setEditingItem({ ...editingItem, image: e.target.value });
                                                    // Also add to images array if not present? No, keep separate for now to avoid confusion
                                                }}
                                                className="w-full pl-8 p-3 border-2 border-slate-300 text-ink bg-white focus:border-gold focus:ring-0 outline-none shadow-sm text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2 p-4 bg-slate-100 border border-slate-200">
                                    <input
                                        type="checkbox"
                                        id="available"
                                        checked={editingItem.available}
                                        onChange={e => setEditingItem({ ...editingItem, available: e.target.checked })}
                                        className="w-5 h-5 text-gold rounded focus:ring-gold border-slate-400 cursor-pointer"
                                    />
                                    <label htmlFor="available" className="text-sm font-bold text-ink uppercase tracking-wide cursor-pointer">Available for ordering</label>
                                </div>

                            </div>

                            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                                <button
                                    onClick={() => handleDelete(editingItem.id!)}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-widest flex items-center"
                                >
                                    <Trash2 size={14} className="mr-1" /> Remove
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 text-slate-500 hover:text-ink font-bold text-xs uppercase tracking-widest transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveModal}
                                        className="px-8 py-3 bg-ink hover:bg-gold hover:text-ink text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MenuEditor;