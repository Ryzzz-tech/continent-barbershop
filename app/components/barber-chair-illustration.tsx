import Image from "next/image";

type BarberChairIllustrationProps = {
  className: string;
  alt?: string;
};

export default function BarberChairIllustration({
  className,
  alt = "",
}: BarberChairIllustrationProps) {
  return (
    <div className={`${className} barber-chair`}>
      <Image
        alt={alt}
        className="barber-chair__image"
        height={560}
        priority
        sizes="(max-width: 900px) 52vw, 560px"
        src="/barber-chair.png"
        width={560}
      />
    </div>
  );
}
