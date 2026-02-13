# Open Person Matching - v0.1-strawman

Open Person Matching is a protocol for finding and communicating documents
pertaining to a specific person identified by a sufficiently unique combination
of descriptors, among a network of many requestors, facilitators, and
responders, without disclosing the value of those descriptors to any responder,
requestor, or facilitator that does not already have them. Although its
technical implementation may vary, its basic mechanics describe a
publish-subscribe interaction between participants (Requestors and Responders)
and Facilitators.

## Version: 0.1-strawman

## Definitions

### Person

Cannonically, a unique human individual. Versions of this protocol could, in
theory, be adapted for matching organizations and other entities.

### Facilitator

An intermediary that recieves and broadcasts Requests on behalf of a Requestor,
then collates the Responses. The Facilitator serves to Authenticate and
Authorize the Requestor, where necessary, and keep Requestors and Responders
identity hidden from each other until direct communication is needed.

### Requestor

The party initiating a Search Flow or other flow

### Responder

One of zero or more entities that process a Request and send a Response to it
indicating that they have or may have documents for the matched person.

### Routing

The process of ensuring that Requests are delivered only to Responders that are
likely to have documents for the Person who is the subject of the Request. This
helps minimize traffic caused by searches and protects Responders from being
overwhelmed with Requests that are costly to evaluate that ultimately do not
match.

### Routing Salt

A relatively high entropy string, rotated periodically, which can be determined
independently by Requestors and Responders who have a complex demographic
identifier (such as `full_name`) for a Person and is used along with that
identifier as the source for a hash to generate a Routing Key.

NOTE: the complex demographic identifier is a network property. It must be the
same across all participants in the network. It should reduce the number of
possibly matched Persons significantly, but is not required to be unique to each
Person. A reasonable number of routing key collisions (or false positives,
depending on how we view them) that are relatively evenly distributed through
the network provides additional anonimity regarding the Person being matched at
the cost of additional network traffic.

The method for determining Routing Salt sources is defined as a property of the
network. However, two example methods are outlined here:

1. Hash of recent blockchain blocks - As defined by the network, Facilitators
   (and potentially other participants) agree upon a blockchain from which to
   derive Routing Salt sources. As Routing Salt rotation periods expire Routing
   Salt sources are derived by inspecting the last 3 accepted blocks as of 10
   minutes before period expiry time. The nonces (or, alternatively, the Merkle
   Roots) of these blocks are concatenated together with the period expiry time
   as a Unix timestamp and used to create a SHA-2-256 hash that serves as the
   new Routing Salt source. Because the Routing Salt source is derived using a
   known algorithm from an external data source that contains unpredictable new
   material each participant can derive the recent Routing Salt sources
   independently and still derive a matching result. The blockchain itelf serves
   to provide authentication and redundancy for updating the Routing Salt
   source. The blockchain also serves to maintain discoverability of old Routing
   Salt sources, though this also means that old sources are never forgotten.
2. Published by Network Authority - An authoritative node on the network,
   perhaps run by the authority that approves Facilitators or participants for
   the network, generates a cryptographically random salt seed and publishes it
   to a well known location with the last three Routing Salt sources and their
   associated unique sequence identifier. Routing Salt sources MUST maintain
   proper sequence to avoid potential routing errors. Alternatively, the Network
   Authority can publish the most recent Routing Salt source to each Facilitator
   and require them to host the three most recent sources. However, this
   presents a greater risk of Routing Salt sources not maintaining
   synchronization (which may or may not be effectively mitigated by this
   specification's Routing Salt rotation provisions.) This method requires that
   the authoritative node have sufficient redundancy and provide some means for
   participants to authenticate updates from the authoritative node.

#### Deriving a Routing Salt

1. The participant obtains the active Routing Salt sources from the network's
   known source or a well known location hosted by their Facilitator
2. The participlant calculates a cryptographic hash (the specific algorithm is a
   property of the network) of the common identifier for the Person using the
   Routing Salt source as the algorithm's salt.
3. The hash from step 2 is returned as bytes. This is the Routing Salt for the
   Person.

NOTE: other algorithms may be adopted as a property of the network.

### Routing Salt Rotation

Routing Salts and their resulting Routing Keys are only intended to be used for
a relatively short period of time in order to make it more difficult to
associate Routing Keys with a possible Person. Routing Salts are rotated by
updating their source material (decribed elsewhere.) Requests are expected to
contain Routing Keys from the 3 most recent Routing Salt rotations. Similarly,
Responders must maintain Routing Registrations for Routing Keys from multiple
rotation periods. Because Routing Salt Rotations require Responders to
recalculate and reregister Routing Keys the rotation period should not be so
frequent as to make reregistration prohibitively expensive.

### Routing Key

A crypotgraphic hash of a complex demographic identifier (such as `full_name`)
for a Person and a Routing Salt that is used to route Requests to Responders
that are likely to have matching documents for the Person.

#### Deriving a Routing Key

1. The participant derives the Routing Salt for the Person
2. The participlant calculates a cryptographic hash (the specific algorithm is a
   property of the network) of the common identifier for the Person using the
   Routing Salt as the hash algorithm's salt.
3. The hash from step 2 is converted to url safe base64. This is the Routing Key
   for the Person.

FIXME: Routing Salts and Keys require that the common identifier have various
standard normalization rules applied

### Routing Registration

A message to a Facilitator establishing an association between a Routing Key and
a Responder (which may be acting as a federating Facilitator for other
Responders) and/or the resulting asociation. Registrations tell Facilitators to
send Requests with a matching Routing Key to the registrant. Routing
Registrations may be deregistered by Responders that no longer need them.
Routing Registrations automatically expire after 5 Routing Salt Rotation
periods.

## Search Flow

The Open Person Matching Search Flow defines a process by which a Requestor may
discover a set of Responders who have documents pertaining to a specific Person
identified by a sufficiently unique combination of descriptors without
disclosing the value of those descriptors to any Responder, Requestor, or
Facilitator that does not already have them.

### Roles in the Search Flow

There a 3 distinct roles in the Search Flow: Requestor, Facilitator, and
Responder

#### The Search Requestor

A Requestor initiates the Search Flow by sending a Request to at least one
Facilitator. A Requestor may prepare parallel Requests for multiple
Facilitators, each Request matching the same Person, but each Request must use
its own nonce to hash the Request's descriptors.

The Requestor will recieve Search Responses from the Facilitator, each
containing its own nonce and demographic hashes. For each Response the Requestor
will verify that the demographic hashes match. The Requestor will then determine
whether it will make additional Search Requests or Document Requests.

#### The Search Facilitator

A Facilitator recieves a Search Request from a Requestor. If the Request
contains authorization data, the Facilitator must validate the authorization
data before proceeding to further process the Request. After validation, the
Facilitator delivers the body of the Request, replacing the original
authorization data with authroization data signed by the Facilitator. If the
Request contains a response ID (`res_id`) it will be routed specifically to the
Responder who sent that Response, though it may not be routable if it is not
within the network's defined session timeout. Requests without a response ID are
sent to all other Facilitators and Responders that have registered the Request's
Routing Key. As Responses come in (within the network's defined timeout) the
Facilitator collects them and forwards them to Requestors for follow up.

Facilitators also recieve Routing Registrations from Responders. This is the
means by which Responders indicate that they should recieve Requests for a given
Routing Key.

#### The Search Responder

A Responder must register Routing Keys with a Facilitator for each Person for
whom they have documents. This requires the Responder to subscribe to updates to
the Routing Salts and recalculate the Routing Keys promptly according to the
Routing Salt rotation strategy. When a Facilitator recieves a Request the
Request is forwareded to every Responder that has registered at least one
matching Routing Key. The Responder then uses the Request nonce to generate its
own values for the Request's descriptor hashes and prepares a Response using a
new nonce for each Person for whom the Routing Key matches. Note that this
implies that the Responder will want to store the Routing Keys currently
registered for each person in order to avoid a slow and costly calculation of
every Person's Routing Keys upon recieving each Request.

### Search Request

A Search Request is a JSON object containing these key - value pairs:

- `id` - a universally unique Request ID to correlate responses with requests
- `res_id` - (optional) the `id` of a previous Response that prompted this
  Request
- `auth` - (optional) authorization data for the Request, if necessary. If
  present, the authorization data should be an object containing a `type` key
  with a well-known identifier indicating the protocol in use. No Request
  authentication protocols are specified at this time. Acceptable authentication
  protocols are defined by an implementing network and must be supported by all
  Facilitators in the network.
- `route` - an array of 1 to 3 Routing Keys for the Request
- `nonce` - a 12-byte nonce in lowercase hexadecimal format from a
  cryptographically random source. This key is called `nonce` specifically to
  indicate that its value should never be used in more than one Request.
- `pub` - (optional) a session public key for the Request session, to be used
  for secure communication with a matched Responder
- `hashes` - an array of demographic hash objects, as defined next
- `data` - (optional) if a correlated `res_id` is present, this key may contain
  url-safe base64 encoded data for the Responder. Except in well specified
  cases - of which there are currently none - this data should be encrypted so
  that it can only be read by the original Responder.

#### Demographic Hash Objects

Several useful demographic types are insufficiently complex (they have too few
possible values) to be effectively used in a hash by themselves because an
attacker could swiftly calculate a "rainbow table" (a table of hashes obtained
from each possible input value when using the supplied salt) to deduce the input
value. Therefore demographic hash objects contain a component array of input
descriptors specifying in order the type and normalization rules to be applied
before concatenating the input values together and calculating the hash. This
component array must contain at least:

- the inputs to the routing key before hashing (that is, the defined complex
  demographic identifier for the network and the Routing Salt)
- at least 1 other complex demographic identifier
- at least 1 other demographic identifier
- preferably, 8 to 12 random bits

A demographic hash object contains these key - value pairs:

- `con` - an array of input descriptor objects, indicating how the hash input is
  intended to be constructed
- `hash` - the hashed value, using the Request's nonce as the hashing
  algorithm's salt
- `req` - (optional) a boolean indicating whether or not matching this hash is
  required. An undefined or `false` value indicates that the Requestor is aware
  that the Responder may or may not be able to match this identifier. A `true`
  value indicates that the Responder must be able to match the identifier.
- `rel` - (optional) the relationship of the person whom the hashed value
  identifies to the Person being identified. If this key is undefined the hash
  refers to the Person themself. Example values may include `parent`, `child`,
  `spouse`, `friend`, etc. Relationship values should be all lowercase letters
  in alphabets where such a distinction exists. Responders may ignore
  relationship hashes.

##### Demographic Input Descriptors

Demographic Input Descriptors are objects containing these key = value pairs:

- `typ` - the well known "type" of the input demographic identifier.
- `nrm` - an array of normalization rules applied to the identifier value before
  including it in the hash input. Rules should be applied in the order that they
  appear.

A Demographic input descriptor that results in an empty string at any point
during normalization never matches.

#### Random Bits Demographic Identifier Type

The random bits demographic identifier type is not a true demographic
identifier, but it functions as one in non-Routing Key demographic hashes. The
inclusion of random bits in a demographic hash requires the Responder to deduce
the random bits used to generate the hash by calculating the hash with all
possible values for the specified number of bits and 0 bits for the remaining
bits required to make a byte. This is useful for demographic hashes that
otherwise would leak input information because they are too simple. The random
bits require a Responder to do 2^n hashes, but they require an attacker to do
2^n multiplied by the complexity of the information the attacker does not know.

- `b{digits}` - `{digits}` is the base 10 count of the number of random bits
  included as a hash input. Values less than 8 are invalid and will be rejected
  by Facilitators. Values larger than 12 are likely to be prohibitive for
  Responders and result in the demographic hash being ignored.

NOTE: DO NOT attempt to use this as a mechanism to exchange secret key material.
The demographic information that makes up the rest of the hash input is known by
many parties, all of whom could easily deduce these bits.

To prevent undue burden on Responders, Requests without a Response ID must not
contain Random Bits Demographic Identifiers. Requests with a Response ID should
use the Random Bits that they derrived from the correlated Response the Response
ID refers to. This puts the computational cost of deducing the random bits on
the Requestor rather than the Responder. This restriction requires the Responder
to respond to inital Requests that may only contain the Routing Key.

#### Well Known Complex Demographic Identifier Types

- `full_name` - the Person's first, middle, and last names as it would likely
  appear on a government issued ID or medical card. Depending on the Person,
  this may or may not include middle names.
- `address` - the Person's fully formatted address
- `dl` - the Person's drivers license in the format
  `{country code}:{state abbreviation}:{id}`
- `gv` - the Person's government issued document in the format
  `{country code}:{type}:{id#}`, where `{type}` may be `p` for passport, `v` for
  visa, or `id` or `id:{state abbreviation}` for ID card or drivers license and
  `{id#}` is the document ID number
- `mi` - the Person's medical insurance plan identifier

##### Simple Demographic Identifier Types

- `birthdate` - the Person's birth date in `YYYY-MM-DD` format
- `phone` - the Person's phone number in e164 format, starting with a `+` and
  including only digits thereafter
- `phone4` - the last 4 digits of the Person's phone number e164 format (may not
  be combined with `phone`)
- `ssn` - the last 4 digits of the Person's social security number
- `cc` - the last 4 digits of the Person's credit card number (Since a Person
  may have multiple credit card numbers on file and there is no way to
  reasonably distinguish order, the Request may be required to send multiple
  versions of a hash containing this identifier)
- `street` - the building number and street name from the Person's address (may
  not be combined with `address`)
- `zip` or `postal` - the postal code from the Person's address (may not be
  combined with `address`)

#### Well Known Demographic Identifier Nomalization Rules

- `lowercase` - all letters in the identifier should be converted to lowercase
- `uppercase` - all letters in the identifier should be converted to uppercase
- `s/{1}/{2}` - all sequences matching the pattern {1} should be replaced with
  the sequence {2}. For this version of this specification patterns should be
  syntactically correct Perl-compatible Regular Expressions though only very
  simple substitutions are supported (i.e. look-ahead, look-behind, capture
  groups, anchors, etc. will result in the Facilitator rejecting the Request)
- `no_space` - whitespace is removed
- `no_punct` - punctuation, such as `.`, `,`, `#`, `-`, etc. is removed
- `us-101-key` - the conversion of all letters to suitable lowercase English
  letters through lowercasing and typographic approximation (needs explicit
  specification) to letters which may be input using a standard US 101-key
  keyboard without the use of any modifier keys
- `us-reduced_v0` - a standardized combination of normalization rules intended
  to be used as a default for names and addresses used in the United States of
  America consisting of: `no_punct`, `no_space`, and `us-101-key`. While it will
  not cover all cases, it is intended to account for many of the variations that
  are likely to appear in demographic data that has been digitally recorded by
  humans using a keyboard.

### Search Response

A Search Response is a JSON object containing these key - value pairs:

- `id` - a universally unique Response ID to correlate follow up Requests with
- `req_id` - the `id` of the Request that prompted this Response
- `nonce` - a 12-byte nonce in lowercase hexadecimal format from a
  cryptographically random source. This key is called `nonce` specifically to
  indicate that its value should never be used in more than one Response.
- `pub` - (optional) a session public key for the Request session, to be used
  for secure communication with a matched Responder
- `hashes` - an array of demographic hash objects, as defined for Search
  Requests
- `data` - (optional) if a correlated `req_id` is present, this key may contain
  url-safe base64 encoded data for the Requestor. Except in well specified
  cases - of which there are currently none - this data should be encrypted so
  that it can only be read by the original Requestor.

Upon recieving a Search Request with a matching Routing Key, a Responder uses
the Request `nonce` and demographic hash objects to regenerate the hashes for
and Person for whom it may have records. A Responder generates a Search Response
only after it has recieved a Search Request that meets these criteria:

1. The Request's Routing Key matches
2. All required demographic hash objects' hashes match exactly
3. At least one demographic hash object's hash matches exactly

A Responder must include matching demographic hash objects with the same key -
value pairs except using a hash calculated using the newly generated Response
nonce for all matches. A Responder may also respond with additional demographic
hash objects indicating a desire for further verification; this is known as a
Maybe Response. If the Responder does not include a public key it is inviting
the Requestor to make an additional Request to confirm the match.

#### Maybe Response

A Responder may include demographic hash objects that did not exist in the
original Request, indicating a desire for further verification. This is known as
a Maybe Response.

#### Facilitator Generated Maybe Responses

In order to detect and prevent infomration harvesting by malicious Requestors,
Facilitators should frequently include one or more Maybe Responses that include
hashes that can not possibly be matched by the Requestor because they are
generated from random values. Malicious Requestors should be prevented from
continuing to use the network according to network defined policies.

### Document Request

A Document Request is a Search Request containing both a response ID (`res_id`)
and a `data` value.

### Document Response

A Document Response is a Search Response containing both a request ID (`res_id`)
and a `data` value.

### Summary of the Search Flow

1. a Requestor submits a Request to a Facilitator
2. the Facilitator sends the Request to registered Responders with a matching
   Routing Key and other Facilitators, who forward the Request to their
   registered Responders with a matching Routing Key
3. Responders respond with matching Responses within a set, network defined
   timeframe
4. Facilitators collate Responses, including Facilitator Generated Maybe
   Responses, and send them to the Facilitator or Requestor from which they
   recieved the Request, with all Responses eventually collated and sent to the
   Requestor
5. the Requestor verifies Response matches and sends a correlated Document
   Request using the Response `id`, along with any required credentials,
   possibly using the provided session public keys to encrypt the Document
   Request. The Requestor may need to make another, more specific Request in
   order to obtain a public key for the Responder.

### Timeouts

While specific timeout values are defined by the implementing network it is
useful to define timeouts that are refered to in this specification.

session timeout - the time period within which a Facilitator must maintain a
mapping between

- a Request ID and a Requestor or Facilatator
- a Response ID and a Responder

in order be able to route correlated Responses and Requests to their appropriate
destination. Because Requests and Responses may travel through multiple
Facilitators, participants must ensure that they deliver correlated messages as
quickly as possible, preferably within less than half the session timeout.

## Defined Network Properties

The mechanism for defining and sharing network properties is not specified at
this time. However there are several properties that an Open Person Matching
network must define. These include:

1. The algorithm for obtaining the current and recent Routing Salt Sources
2. The complex demographic identifier or demographic hash object used to
   calculate routing keys
3. The currently used algorithm for deriving a Routing Salt
4. The currently used algorithm for deriving a Routing Key
5. The currently used hashing algorithm for demographic hashes
6. Request Session Timeout - the amount of time a Requestor and Facilitator
   should maintain a reference to a Request that Responses may be associated
   with
7. Response Session Timeout - the amount of time a Responder and Facilitator
   should maintain a reference to a Responses that future Requests may be
   associated with
8. acceptable authentication protocols for Faciltators on the network

An Open Person Matching network must not define these properties in a way that
is insufficiently secure or results in the disclosure of demographic information
to any party that does not already have it.
