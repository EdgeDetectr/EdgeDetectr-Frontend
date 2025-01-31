import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function TermsDialog({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms of Use</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <section className="space-y-2">
            <h3 className="font-semibold">1. Acceptance of Terms</h3>
            <p>By accessing or using our edge detection service, you agree to be bound by these terms of use. If you disagree with any part of these terms, you do not have permission to access the service.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">2. User Responsibilities</h3>
            <p>You are solely responsible for your use of the service and any consequences thereof. You agree to use the service only for lawful purposes and in accordance with these terms.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">3. Image Processing & Rights</h3>
            <p>Our service processes your images using various edge detection algorithms. While you retain all rights to your original images, you grant us a limited license to process and store them temporarily for service delivery.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">4. Usage Limitations</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Maximum file size: 100 MB per image</li>
              <li>Supported formats: JPEG, PNG, GIF</li>
              <li>Fair usage: Maximum 100 images per hour</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">5. Privacy & Data</h3>
            <p>Images are temporarily stored for processing and automatically deleted after 1 hour. We do not claim ownership of your images or use them for any purpose other than providing the service.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">6. Prohibited Content</h3>
            <p>Users must not upload images containing inappropriate, illegal, or harmful content. We reserve the right to refuse service and report illegal activities to appropriate authorities.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">7. Disclaimer of Warranties</h3>
            <p>The service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">8. Limitation of Liability</h3>
            <p>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">9. Indemnification</h3>
            <p>You agree to indemnify and hold us harmless from any claims arising from your use of the service or violation of these terms.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">10. Changes to Terms</h3>
            <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
} 