import type { Language, ChannelLanguageAssignment } from '#shared/types';
import { nextId } from './ids';

export function buildChannelLanguage(
  overrides?: Partial<Language>,
): Language {
  return {
    _id: nextId('lang'),
    _type: 'language',
    name: 'English',
    active: true,
    ...overrides,
  };
}

export function buildChannelLanguageAssignment(
  overrides?: Partial<ChannelLanguageAssignment>,
): ChannelLanguageAssignment {
  return {
    _id: nextId('lang'),
    _type: 'language',
    active: true,
    ...overrides,
  };
}
