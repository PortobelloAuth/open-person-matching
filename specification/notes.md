# Notes

This page is not cannonical. It is intended to capture ideas that may eventually
be reflected in the specification before they have been vetted sufficiently for
inclusion.

## Charateristics

- [ ] Should be suitable replacement for proprietary and custom patient matching
      algorithms, but applied to a broader set of use cases
  - [ ] finding a person's published, use case specific signing and encryption
        keys
  - [ ] specific use cases include
    - [ ] self sovereign identity token signing keys
    - [ ] authorization document token signing keys
    - [ ] public and sender-specific messaging encryption keys
    - [ ] patient matching for medical records search
- [ ] Uses hashes of nonce and demographic strings
  - [ ] For languages where character substitution may take place simplified
        demographic strings may be used
    - [ ] requests using simplified demographic strings must specify that they
          are doing so and the ruleset they are employing
    - [ ] An example ruleset could require that simplified demographic strings
          contain only lowercase latin-1 alphanumeric characters, with
          whitespace and punctuation removed, and accented and non-latin-1
          characters substituted with defined common replacement values
    - [ ] simplified demographic strings are not intended to account for
          nicknames and alternate spellings. A requestor is expected to make a
          secondary request using alternate values in such cases.
  - [ ] each request and response should generate its own nonce and hashes based
        on that nonce
  - [ ] it may seem appropriate to send some sufficiently generic demographic
        information which can not be tied back to a small group of individuals
        by itself - such as a postal code - without nonce hashing in order to
        improve search performance on responding nodes. However, doing so should
        be avoided because there may be unexpected circumstances that cause this
        to reveal information to search participants.
  - [ ] Note: postal codes are generally too short to be used by themselves in
        cryptographic hashes, since an attacker could create a rainbow table of
        all possible codes in a relatively short time frame. This isn't usually
        catestrophic because many people live in a zip code, but could be
        problematic in circumstances where very few people from a given zip code
        have records on a specific network node
- [ ] Never returns “not found” for a direct query; instead responds with a
      Maybe with an additional parameter that is unmatchable (so that Maybe
      responses don’t give away that the responder has or doesn’t have
      information about a person with the supplied information). The unmatchable
      value will usually be a nonce hash for one of the supplied fields using a
      random byte array for the hashed value.
- [ ] A Maybe response should indicate additional fields that may allow a match
- [ ] Additional fields may indicate a relevant time frame
- [ ] Initial request includes a nonce used to calculate the nonce hashes and
      the nonce hashes. It must include a universally unique request id.
- [ ] A response looks like a request, except that it may also contain
      additional field values and must include a correlation id specifying the
      request id.
- [ ] A requestor decides whether to continue with a more specific request or to
      abandon further requests
- [ ] This protocol may be expensive for responders, who may throttle requests
- [ ] When a requestor believes that there is a match they send a request with a
      public key. Responses to public key requests must match with very high
      confidence… (maybe requests always have the key?)
- [ ] should be as simple as possible to explain
- [ ] should be as simple as possible to implement

## To incorporate

- [ ] use facilitators as an intermediary between requestor and responder to
      hide the source of Maybe responses
- [ ] broadcast requests must inherently have a "not found" state so that the
      requestor is not flooded by responses from every node
- [ ] Responses that are Maybe responses should be limited to matches that meet
      a certain minimum threshold of demographics met
- [ ] Responses that are Maybe responses should not be returned for a request
      that contains a non-matching requestor specific identifier hash
- [ ] Responses that are Maybe responses should not be returned for a
      demographic set that contains a requestor specific identifier unless an
      equivalent demographic set without the requestor specific identifier (a
      "public" or "general" demogrphic set) should also be considered.
- [ ] Cooperative XOR voting - As the Routing Salt rotation period is about to
      expire each Facilitator attempts to notify each other Facilitator of it's
      contribution to the new Routing Salt source - a cryptographically random
      256 byte sequence. Once a Facilitator has valid (sufficiently high
      entropy) contributions from at least one quarter of the Facilitators it
      publishes a vote for the valid contributions it has recieved.
      Contributions that are included in the lesser of one quarter of top 10
      most votes, including ties, are XOR'd together and published as a proposed
      Routing Salt (or just use Raft or Paxos...)
- [ ] `g` - an optional group name indicating that this is one of multiple
      possible hash values... (possible demographic hash object key)
- [ ] `id:{1}:{2}` - an identification number associated with the person, such
      as a medical ID, drivers license ID... (possible demographic identifier
      type)
- [ ] `n{optional suffix}` - a network specific (loosely interpreted)
      demographic identifier. The optional suffix allows for many such
      identifiers for networks that need them.
- [ ] SHA-2-256 can be replaced by more modern and secure (slower) password
      hashing algorithms
- [ ] `b{digits}` hashes that require the responder to discover the random bits
      represent a vector for a DOS-style attack. Consider having the responder
      provide a public key as an initial response with its own hash, ignoring
      any hashes in the request to put the bulk of the intial work on the
      requestor. The hash may be able to be based on the key derived from the
      request public key and the response public key, making it unique to the
      requestor and responder.

---

Ideas for reducing compute burden for Responders (shift burden to Requestors)

- [ ] Registrants can preregister a response with a nonce with a hash with
      routing bits.
  - [ ] Try to make this more opaque for the facilitator (and anyone spying
        there)
    - [ ] The routing key might pair with semi-recent salt elected by the
          registrant (avoid responders having to recalculate routing keys as
          frequently)
      - [ ] Facilitator keeps active salt sources for active routing key
            registration prefixes (but only so they can be expired as
            registration expire)
        - [ ] Salt sources and registrations don’t expire very quickly unless
              the registrant asks them too
        - [ ] A requestor first requests the list of active salts
        - [ ] (?) How does this work for other facilitators? The list of salts
              would always be too long.
      - [ ] Separately, facilitator keeps nonces for preregistered responses
            that contain random bits (still using only routing key inputs)
            lookup is by routing key prefix
- [ ] (preferred) Salt sources known and easily looked up (can have as many as
      20+ really, just don’t want 1000+) as long as the responder only needs it
      at registration.
  - [ ] Registration includes a routing key prefix mapped to one or more structs
        containing: a nonce and a hash of the routing key inputs, the nonce
        (registration salt), and 8-16 random bits - plus maybe a (random)
        registration ID (which acts like a response ID) and a web hook to call
        specific to that registration
    - [ ] Registering under a routing key prefix should increase the probability
          of collisions a small amount but make it difficult to work backward to
          the source value
    - [ ] Registering under a routing key prefix also improves network
          efficiency by avoiding the need to send multiple routing keys to each
          Responder
  - [ ] Requestor starts by pulling all salt sources
  - [ ] Requestor then calculates the routing key for all salt sources
  - [ ] Requestor then sends a request to Facilitator containing all routing
        keys
  - [ ] Facilitator responds with a list of all registrations that have a
        matching Routing Key prefix, including the nonce (registration salt) and
        hash
  - [ ] Requestor uses local information to deduce the random bits and, if it
        can create a matching hash, creates a request using a new request nonce,
        the registration id as response id, and a hash of the request nonce, the
        routing key inputs, and the deduced random bits
  - [ ] (?) do facilitators do proxy registrations? Or do they just proxy
        requests for nonce (registration salt) and hash? This is probably
        cacheable.
    - [ ] Assume proxied requests for nonce, hash, and response id for now

---

The (enterprise) Master Patient (or Person) Index use case is NOT the same as
the Record Locator Service use case - especially in a heterogenous network!

- [ ] eMPI as a process attempts to match the person referred to in each record
      with all other records in an enterprise to create a "Golden Record". It
      is, at very least, an iterative version of the Record Locator Service
      process.
- [ ] a Record Locator Service only needs to match one person to all of their
      records.
- [ ] an eMPI process may employ personel from the enterprise to help confirm
      records matches.
  - [ ] matched persons may be secondarily involved if the process is deemed to
        sufficiently maintain privacy
- [ ] a Record Locator Service process does not necessarily know the agent
      performing a search
- [ ] eMPI is particularly useful when you have full access to the person
      demographics in each record. This is relatively true within an enterprise
      network, at least where a single security perimeter is being considered.
      It is not true in a heterogenous network.
  - [ ] because the records are being shared within the enterprise access to
        them for eMPI purposes can be more readily secured to only those
        processes which are known to need it
  - [ ] active agents in the process are all controlled by the enterprise
- [ ] heterogeonous networks cannot maintain sufficiently strict security
      standards to allow general patient access; general patient access
      essentially means everyone.
  - [ ] not a limited set of personel
  - [ ] no single network authority (several organizational authorities
        attempting to comply with their own interpretations of a shared
        standard, with auditing as a reconcilliation mechanism)
- [ ] eMPI can and should be used within a Responder's internal data to ensure
      that a "Golden Record" exists for a patient / person that includes all
      confirmed names, addresses, identity documents, photos, etc. - including
      historical information - that the Responder is authorized to maintain.
  - [ ] well maintained "Golden Records" allow responders to avoid duplicate
        registrations
  - [ ] matches on known alternative demographics are inherently better than
        matches on suspected matches
