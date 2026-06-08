export type SkeletonVariant = 'text' | 'block' | 'avatar' | 'table' | 'form';

export type SkeletonSize = 'sm' | 'md' | 'lg';

export type SkeletonProps = {
  variant?: SkeletonVariant;
  rows?: number;
  size?: SkeletonSize;
  animated?: boolean;
};
