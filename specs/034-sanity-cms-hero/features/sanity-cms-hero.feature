Feature: Sanity CMS Hero
  As a content editor and site visitor
  I want the home page hero to be driven by Sanity CMS
  So that the hero can be updated without code changes and stays in sync with content

  Background:
    Given the Zeeks home page is configured with a Sanity page document of slug "/"
    And the system is ready for Sanity content fetching

  @US1_render_hero_from_sanity
  Scenario: Render the full hero from the Sanity heroBlock
    Given the Sanity home page document has a heroBlock
    When the home page is requested
    Then the hero renders the eyebrow, heading, subheading, background image, and both CTA labels and hrefs from the heroBlock

  @US1_render_hero_from_sanity
  Scenario: Background image is served from the Sanity CDN
    Given the hero has a background image asset in Sanity
    When the hero renders
    Then the background image is served from the Sanity image CDN URL and not a local static file

  @US1_render_hero_from_sanity
  Scenario: Hero reflects Sanity content updates
    Given editors update the heroBlock fields in Sanity
    When the content is revalidated
    Then the home page hero reflects the new values without a code deploy

  @US2_graceful_fallback
  Scenario: Missing heroBlock degrades gracefully
    Given the home page document has no heroBlock
    When the home page is requested
    Then the hero renders with no content and does not throw or show mock copy

  @US2_graceful_fallback
  Scenario: Missing background image keeps a neutral state
    Given the heroBlock has no background image asset
    When the hero renders
    Then the section keeps its neutral dark background and displays no broken image

  @US2_graceful_fallback
  Scenario: Unset CTA does not render a dead button
    Given the heroBlock has a CTA without a label or href
    When the hero renders
    Then that button is omitted rather than rendered as a dead link
