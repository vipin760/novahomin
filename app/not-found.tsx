import { ButtonLink } from "@/components/button";
import { LightHero } from "@/components/ui";

export default function NotFound() {
  return (
    <LightHero
      id="not-found-heading"
      title="Page not found"
      text="The page you are looking for has moved or no longer exists."
    >
      <div className="button-row">
        <ButtonLink href="/" variant="dark">
          Back to home
        </ButtonLink>
      </div>
    </LightHero>
  );
}
