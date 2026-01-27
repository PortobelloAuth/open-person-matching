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
