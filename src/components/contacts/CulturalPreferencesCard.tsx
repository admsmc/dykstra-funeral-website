'use client';

import { motion } from 'framer-motion';
import { Globe, Heart, Utensils } from 'lucide-react';

interface CulturalPreferencesCardProps {
  contact: any;
  onRefresh: () => void;
}

export function CulturalPreferencesCard({ contact, onRefresh }: CulturalPreferencesCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-lg shadow-sm border border-[--sage] border-opacity-20 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-[--sage]" />
        <h2 className="text-lg font-serif text-[--navy]">Cultural Preferences</h2>
      </div>

      <div className="space-y-3">
        {contact.religiousAffiliation && (
          <div>
            <label className="text-xs text-[--charcoal] opacity-60 flex items-center gap-1 mb-1">
              <Heart className="w-3 h-3" />
              Religious Affiliation
            </label>
            <p className="text-sm text-[--navy]">{contact.religiousAffiliation}</p>
          </div>
        )}

        {contact.culturalPreferences && contact.culturalPreferences.length > 0 && (
          <div>
            <label className="text-xs text-[--charcoal] opacity-60 mb-1 block">
              Cultural Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {contact.culturalPreferences.map((pref: string) => (
                <span
                  key={pref}
                  className="px-2 py-1 text-xs bg-[--sage] bg-opacity-20 text-[--navy] rounded-full"
                >
                  {pref}
                </span>
              ))}
            </div>
          </div>
        )}

        {contact.dietaryRestrictions && contact.dietaryRestrictions.length > 0 && (
          <div>
            <label className="text-xs text-[--charcoal] opacity-60 flex items-center gap-1 mb-1">
              <Utensils className="w-3 h-3" />
              Dietary Restrictions
            </label>
            <div className="flex flex-wrap gap-2">
              {contact.dietaryRestrictions.map((restriction: string) => (
                <span
                  key={restriction}
                  className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full"
                >
                  {restriction}
                </span>
              ))}
            </div>
          </div>
        )}

        {contact.languagePreference && (
          <div>
            <label className="text-xs text-[--charcoal] opacity-60 mb-1 block">
              Language Preference
            </label>
            <p className="text-sm text-[--navy] capitalize">
              {contact.languagePreference.replace('_', ' ')}
            </p>
          </div>
        )}

        {!contact.religiousAffiliation &&
          !contact.culturalPreferences?.length &&
          !contact.dietaryRestrictions?.length &&
          !contact.languagePreference && (
            <p className="text-sm text-[--charcoal] opacity-60 text-center py-4">
              No cultural preferences recorded
            </p>
          )}
      </div>
    </motion.div>
  );
}
