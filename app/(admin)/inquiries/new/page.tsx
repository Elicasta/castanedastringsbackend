import { createInquiryAction } from "@/lib/actions/inquiries";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default async function NewInquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div>
      <PageHeader title="New Inquiry" description="Log a new booking inquiry." />
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3 mb-4">{error}</p>}
      <Card>
        <form action={createInquiryAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" name="first_name" required />
            </div>
            <div>
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" name="last_name" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="event_type">Event type</Label>
              <Input id="event_type" name="event_type" placeholder="Wedding ceremony" />
            </div>
            <div>
              <Label htmlFor="event_date">Event date</Label>
              <Input id="event_date" name="event_date" type="date" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="event_start_time">Start time</Label>
              <Input id="event_start_time" name="event_start_time" type="time" />
            </div>
            <div>
              <Label htmlFor="event_end_time">End time</Label>
              <Input id="event_end_time" name="event_end_time" type="time" />
            </div>
          </div>
          <div>
            <Label htmlFor="location_name">Venue</Label>
            <Input id="location_name" name="location_name" placeholder="Vizcaya Museum & Gardens" />
          </div>
          <div>
            <Label htmlFor="location_address">Address</Label>
            <Input id="location_address" name="location_address" />
          </div>
          <div>
            <Label htmlFor="guest_count">Guest count</Label>
            <Input id="guest_count" name="guest_count" type="number" min={1} />
          </div>
          <div>
            <Label htmlFor="requested_services">Requested services</Label>
            <Input id="requested_services" name="requested_services" placeholder="Solo violin, ceremony + cocktail hour" />
          </div>
          <div>
            <Label htmlFor="message">Client message</Label>
            <Textarea id="message" name="message" rows={3} />
          </div>
          <div>
            <Label htmlFor="internal_notes">Internal notes</Label>
            <Textarea id="internal_notes" name="internal_notes" rows={2} />
          </div>
          <Button type="submit" className="w-full">Save inquiry</Button>
        </form>
      </Card>
    </div>
  );
}
