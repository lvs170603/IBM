
'use client';

export const dynamic = "force-dynamic";

import { ProfileSheet } from "@/components/dashboard/profile-sheet";
import { useState } from "react";

export default function ProfilePage() {
    const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(true);

    return (
        <ProfileSheet
            isOpen={isProfileSheetOpen}
            onOpenChange={setIsProfileSheetOpen}
        />
    )
}
