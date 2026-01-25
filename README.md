# Open Person Matching

Open Person Matching is a person matching specification and reference
implementation. It allows searching for nodes in a network that have records for
a person without revealing that persons demogrphic information to those who do
not already have it. Its primary use case is supporting finding a persons
self-sovreign signing and encryption keys. This directly supports truly
self-sovereign identity, non-repudiatable signatures of electronic documents,
and private, client agnostic PKI-based encrypted communications with options for
spam filtering agents. These use cases and the base algorithm also allow it to
be used for patient matching and medical records search, a domain from which it
draws many design goals.

## Charateristics

- [ ] Should be suitable replacement for proprietary and custom patient matching
      algorithms, but applied to a broader set of use cases - [ ] finding a
      person's published, use case specific signing and encryption keys - [ ]
      specific use cases include - [ ] self sovereign identity token signing
      keys - [ ] authorization document token signing keys - [ ] public and
      sender-specific messaging encryption keys - [ ] patient matching for
      medical records search
- [ ] Uses hashes of nonce and demographic strings - [ ] For languages where
      character substitution may take place simplified demographic strings may
      be used - [ ] requests using simplified demographic strings must specify
      that they are doing so and the ruleset they are employing - [ ] An example
      ruleset may require that simplified demographic strings contain only
      lowercase latin-1 alphanumeric characters, with whitespace and punctuation
      removed, and accented and non-latin-1 characters substituted with defined
      common replacement values - [ ] simplified demographic strings are not
      intended to account for nicknames and alternate spellings. A requestor is
      expected to make a secondary request using alternate values in such cases.
      - [ ] each request and response should generate its own nonce and hashes
      based on that nonce - [ ] it may seem appropriate to send some
      sufficiently generic demographic information which can not be tied back to
      a small group of individuals by itself - such as a postal code - without
      nonce hashing in order to improve search performance on responding nodes.
      However, doing so should be avoided because there may be unexpected
      circumstances that cause this to reveal information to search
      participants.
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
- [ ] A request or decides whether to continue with a more specific request or
      to abandon further requests
- [ ] This protocol may be expensive for responders, who may throttle requests
- [ ] When a request or believes that there is a match they send a request with
      a public key. Responses to public key requests must match with very high
      confidence… (maybe request always have the key?)
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

## Identity is not Authentication; Authentication is not Authorization

The distinction can sometimes be subtle, but it is very important.

A name is an identifier. It helps to uniquely select a person or thing from a
set of similar persons or things. But, just because you know my name does mean
that you are me.

Authentication is the process of proving that something is what it claims to be.
This involves both identifying the thing and verifying facts about it that prove
it is the identified thing. When you log in to a service with a username and
password the username identifies you uniquely among all other users of the
service. The password - in theory, something only you know - proves that you
know something only you could know (and that is both why passwords work and why
passwords fail.)

Authorization is the process of determining what an agent is allowed to do. An
agent is someone or something that works on a person (or group’s) behalf. It may
be the person themself, but it usually is not. In order to authorize an agent
the agent must be identified and authenticated, the authorizer must be
identified and authenticated, and the authorization must be defined and within
the authority of the authorizer to give.

That is, Authentication builds on Identity and privacy. Authorization builds on
Authentication.

Why does this matter? Searching for a person's identity signing key, a patient’s
medical records, or other records requires that we first identify the person
that we are talking about. We also need to identify the person performing the
search. Having identified the searcher we need to authenticate them to ensure
that they are who we think they are. Finally, we need to verify that they are
authorized to do the search.

[Critically, that’s all just table stakes. It is the bare minimum that we need
to do in a simple network environment where one entity controls the security of
and trust each of the nodes. A Health Information Network mimics that, but it is
not that. Every node is its own organization. They agree to follow certain
policies and to allow audits, but the network has limited visibility in to what
each participant is actually doing. It is hard enough to secure a network when
you own every node. It is much harder when all you can do is periodic audits. An
inter-organizational network must meet a higher standard.]

Critically, that’s all just table stakes. It is the bare minimum that we need to
do in a simple network environment where one entity controls the security of and
trust each of the nodes. A heterogeneous inter-organizational network may take
steps to mimic that, but it is not that. Every node is its own organization.
They can agree to follow certain policies and to allow audits, but the network
has limited visibility in to what each participant is actually doing. It is hard
enough to secure a network when you own every node. It is much harder when all
you can do is periodic audits. Communication protocols for an
inter-organizational network must meet a higher standard.

[As is highlighted by Epic’s recent lawsuit allegations against Health Gorilla
and others, Health Information Networks like Carequality and TEFCA currently
don’t do request level authentication and authorization. There are various
standards to be met before joining the network and audits that must be passed
periodically, but once a node is on the network there is only a basic check to
see if they are using a purpose of use for which they are approved and there is
documentation (but not authentication) of the requestor and their NPI. There is
no authentication of the requestor, no authentication of the patient they are
acting on behalf of, and no verification of authorization. This is quite normal
for health care, but it is also a potential enabler for various kinds of fraud.
Audit logs become potentially vulnerable honeypots filled with valuable PII.]

Searching for a person’s records in an inter-organizational network means taking
steps to ensure that we don’t reveal the person’s demographic information
unnecessarily. [In a Health Information Network today, this is often handled by
a Master Patient Index or Record Locator Service that has some pre-populated
knowledge or algorithm for determining whether a Provider is likely to have
records. Notably, providers do not trust this determination and run their own
patient matching. The implication is that the MPI or RLS is likely to result in
contacting at least some providers that will not actually respond with records
for the patient, if they ever had any.]

The Open Person Matching Protocol is designed to use cryptographic hashes of
demographic data and other identifiers to provide a high degree of certainty of
a matched person when both requesting and responding nodes have the same or
similar demographic data without revealing that data to anyone who does not
already have it.
