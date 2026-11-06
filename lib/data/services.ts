export type CustomerService = {
  id: string;
  name: string;
  price: number;
  description?: string;
};

export const customerServices: CustomerService[] = [
  {
    id: "regular-haircut",
    name: "Regular Haircut",
    price: 50000,
    description: "Haircut, Hairwash, Tonic, Massage, Styling, Hair Product.",
  },
  {
    id: "premium-haircut",
    name: "Premium Haircut",
    price: 70000,
    description:
      "Haircut, Hairwash, Tonic, Massage, Facial Steam, Styling, Hair Product.",
  },
  {
    id: "full-service",
    name: "Full Service",
    price: 125000,
    description:
      "Haircut, Hairwash, Tonic, Massage, Facial Steam, Mask, Styling.",
  },
  {
    id: "hair-styling",
    name: "Hair Styling",
    price: 20000,
    description: "Hair Wash, Tonic, Massage, Hair Styling, Hair Product.",
  },
  {
    id: "creambath",
    name: "Creambath",
    price: 80000,
  },
  {
    id: "creambath-facial-steam",
    name: "Creambath + Facial Steam",
    price: 100000,
  },
  {
    id: "creambath-full-facial",
    name: "Creambath + Full Facial",
    price: 160000,
  },
  {
    id: "perming",
    name: "Perming (Keriting Rambut)",
    price: 150000,
  },
  {
    id: "hair-colour",
    name: "Hair Colour",
    price: 100000,
  },
  {
    id: "highlight",
    name: "Highlight",
    price: 250000,
  },
  {
    id: "home-service",
    name: "Home Service",
    price: 100000,
  },
];

export const featuredServiceIds = [
  "regular-haircut",
  "premium-haircut",
  "full-service",
  "hair-styling",
  "hair-colour",
  "home-service",
];
