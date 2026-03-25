import { motion } from 'framer-motion';

interface RadiusControlProps {
    radius: number;
    onChange: (radius: number) => void;
}

export default function RadiusControl({
    radius,
    onChange,
}: RadiusControlProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                delay: 0.1,
            }}
            className="absolute top-16 left-2 z-10 w-[calc(100%-1rem)] max-w-[200px] rounded-lg bg-white p-2 shadow-lg md:top-4 md:left-4 md:max-w-xs md:p-4"
        >
            <div className="space-y-1 md:space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 md:text-sm">
                        Radius
                    </label>
                    <span className="text-xs font-medium text-blue-600 md:text-sm">
                        {radius} km
                    </span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="50"
                    value={radius}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="slider h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 md:h-2"
                    style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(radius / 50) * 100}%, #e5e7eb ${(radius / 50) * 100}%, #e5e7eb 100%)`,
                    }}
                />
                <div className="flex justify-between text-[10px] text-gray-500 md:text-xs">
                    <span>1 km</span>
                    <span>50 km</span>
                </div>
            </div>
        </motion.div>
    );
}
