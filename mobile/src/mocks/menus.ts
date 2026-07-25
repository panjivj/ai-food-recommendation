import type { Menu } from '@/types/domain'
import oatPisangYogurtImage from '@/assets/images/foods/oat-pisang-yogurt.webp'
import nasiMerahAyamImage from '@/assets/images/foods/nasi-merah-ayam-panggang.webp'
import supIkanSayuranImage from '@/assets/images/foods/sup-ikan-sayuran.webp'
import gadoGadoImage from '@/assets/images/foods/gado-gado-seimbang.webp'
import sotoAyamImage from '@/assets/images/foods/soto-ayam-bening.webp'

export const demoMenus: Menu[] = [
  {
    id: 'menu-oat-pisang',
    name: 'Oat Pisang & Yogurt',
    mealType: 'breakfast',
    description: 'Sarapan lembut dengan rasa manis alami dan serat yang cukup.',
    imageUrl: oatPisangYogurtImage,
    nutrition: {
      calories: 385,
      proteinG: 16,
      carbohydrateG: 59,
      fatG: 10,
      fiberG: 8,
      sodiumMg: 145,
    },
    preparationMinutes: 10,
    ingredients: ['Oat', 'Pisang', 'Yogurt tawar', 'Biji chia'],
    instructions: ['Masak oat hingga lembut.', 'Tambahkan yogurt dan irisan pisang.'],
    explanation:
      'Menu ini sesuai untuk sarapan karena memberikan kombinasi karbohidrat, protein, dan serat dalam porsi yang seimbang.',
  },
  {
    id: 'menu-nasi-ayam',
    name: 'Nasi Merah Ayam Panggang',
    mealType: 'lunch',
    description: 'Menu makan siang tinggi protein dengan sayuran segar.',
    imageUrl: nasiMerahAyamImage,
    nutrition: {
      calories: 610,
      proteinG: 42,
      carbohydrateG: 68,
      fatG: 18,
      fiberG: 9,
      sodiumMg: 510,
    },
    preparationMinutes: 30,
    ingredients: ['Nasi merah', 'Dada ayam', 'Brokoli', 'Wortel'],
    instructions: ['Panggang ayam hingga matang.', 'Sajikan bersama nasi dan sayuran.'],
    explanation:
      'Kandungan protein dan serat pada menu ini membantu melengkapi kebutuhan makan siang sesuai target kalori harian.',
  },
  {
    id: 'menu-sup-ikan',
    name: 'Sup Ikan & Sayuran',
    mealType: 'dinner',
    description: 'Makan malam hangat dengan kuah ringan dan aneka sayuran.',
    imageUrl: supIkanSayuranImage,
    nutrition: {
      calories: 430,
      proteinG: 35,
      carbohydrateG: 38,
      fatG: 14,
      fiberG: 7,
      sodiumMg: 470,
    },
    preparationMinutes: 25,
    ingredients: ['Ikan kakap', 'Kentang', 'Tomat', 'Buncis'],
    instructions: ['Rebus kaldu dan sayuran.', 'Masukkan ikan dan masak hingga matang.'],
    explanation:
      'Menu berkuah ini memberikan protein dan sayuran dengan jumlah kalori yang tetap sesuai untuk makan malam.',
  },
  {
    id: 'menu-gado-gado',
    name: 'Gado-Gado Seimbang',
    mealType: 'lunch',
    description: 'Alternatif makan siang berisi sayuran, tahu, dan telur.',
    imageUrl: gadoGadoImage,
    nutrition: {
      calories: 540,
      proteinG: 24,
      carbohydrateG: 55,
      fatG: 25,
      fiberG: 10,
      sodiumMg: 480,
    },
    preparationMinutes: 20,
    ingredients: ['Sayuran rebus', 'Tahu', 'Telur', 'Saus wijen'],
    instructions: ['Tata sayuran dan protein.', 'Tambahkan saus sesaat sebelum disajikan.'],
    explanation:
      'Alternatif ini menawarkan variasi sumber protein dan sayuran dengan porsi yang tetap terukur.',
  },
  {
    id: 'menu-soto-ayam',
    name: 'Soto Ayam Bening',
    mealType: 'dinner',
    description: 'Alternatif makan malam dengan kuah bening dan protein tanpa kulit.',
    imageUrl: sotoAyamImage,
    nutrition: {
      calories: 410,
      proteinG: 31,
      carbohydrateG: 42,
      fatG: 13,
      fiberG: 5,
      sodiumMg: 520,
    },
    preparationMinutes: 25,
    ingredients: ['Ayam tanpa kulit', 'Kol', 'Tomat', 'Bihun'],
    instructions: ['Masak kuah hingga harum.', 'Sajikan ayam dan sayuran bersama kuah.'],
    explanation:
      'Menu ini menjadi alternatif yang ringan dengan protein cukup dan porsi karbohidrat yang terkontrol.',
  },
]
