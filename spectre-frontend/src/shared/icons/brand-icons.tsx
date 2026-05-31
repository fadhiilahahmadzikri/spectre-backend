interface IconProps {
  size?: number;
  className?: string;
}

export function HuggingFaceIcon({ size = 24, className }: IconProps) {
  return <img src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg" width={size} height={size} alt="Hugging Face" className={className} />;
}

export function SupabaseIcon({ size = 24, className }: IconProps) {
  return <img src="https://cdn.jsdelivr.net/gh/supabase/supabase@master/packages/common/assets/images/supabase-logo-icon.svg" width={size} height={size} alt="Supabase" className={className} />;
}

export function TensorFlowIcon({ size = 24, className }: IconProps) {
  return <img src="https://upload.wikimedia.org/wikipedia/commons/2/2d/Tensorflow_logo.svg" width={size} height={size} alt="TensorFlow" className={className} />;
}
