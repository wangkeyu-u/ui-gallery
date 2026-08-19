import rawItems from '../preview-data.json';
import { gallerySchema } from './gallery-schema';

export const galleryItems = gallerySchema.parse(rawItems);
